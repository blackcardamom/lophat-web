mod utils;

use lophat::{
    algorithms::{LockFreeAlgorithm, LockingAlgorithm, RVDecomposition},
    columns::{Column, VecColumn},
    utils::{anti_transpose, PersistenceDiagram},
};
use spade::Point2;
use wasm_bindgen::prelude::*;
pub use wasm_bindgen_rayon::init_thread_pool;

use rayon::{current_num_threads, prelude::*};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub struct WebPersistenceDiagram {
    paired: Vec<u32>,
    unpaired: Vec<u32>,
}

#[wasm_bindgen]
impl WebPersistenceDiagram {
    #[wasm_bindgen(getter)]
    pub fn paired(&self) -> js_sys::Uint32Array {
        js_sys::Uint32Array::from(&self.paired[..])
    }
    #[wasm_bindgen(getter)]
    pub fn unpaired(&self) -> js_sys::Uint32Array {
        js_sys::Uint32Array::from(&self.unpaired[..])
    }
}

impl From<PersistenceDiagram> for WebPersistenceDiagram {
    fn from(value: PersistenceDiagram) -> Self {
        let paired = value
            .paired
            .into_iter()
            .flat_map(|pair| vec![pair.0 as u32, pair.1 as u32])
            .collect();
        let unpaired = value.unpaired.into_iter().map(|elem| elem as u32).collect();
        WebPersistenceDiagram { paired, unpaired }
    }
}

#[wasm_bindgen]
pub fn panic_init() {
    utils::set_panic_hook();
}

#[wasm_bindgen]
pub fn rayon_sum(numbers: &[i32]) -> i32 {
    numbers.par_iter().sum()
}

#[wasm_bindgen]
pub fn rayon_n_threads() -> i32 {
    current_num_threads() as i32
}

#[wasm_bindgen]
pub fn compute_pairings(
    boundaries: &[usize],
    indexes: &[usize],
    dimensions: &[usize],
) -> WebPersistenceDiagram {
    let mut matrix = vec![];
    let n_cols = indexes.len();
    for i in 0..n_cols {
        let start = indexes[i];
        let end = indexes.get(i + 1).copied().unwrap_or(boundaries.len());
        let col = &boundaries[start..end];
        let dimension = dimensions[i];
        matrix.push(VecColumn::from((dimension, col.into())));
    }
    let at = anti_transpose(&matrix);
    let decomp = LockFreeAlgorithm::decompose(at.into_iter(), None);
    let diagram = decomp.diagram().anti_transpose(n_cols);
    diagram.into()
}

#[wasm_bindgen]
pub struct AlphaPersistenceDiagram {
    paired: Vec<f64>,
    unpaired: Vec<f64>,
    paired_dimensions: Vec<u32>,
    unpaired_dimensions: Vec<u32>,
}

#[wasm_bindgen]
impl AlphaPersistenceDiagram {
    #[wasm_bindgen(getter)]
    pub fn paired(&self) -> js_sys::Float64Array {
        js_sys::Float64Array::from(&self.paired[..])
    }
    #[wasm_bindgen(getter)]
    pub fn unpaired(&self) -> js_sys::Float64Array {
        js_sys::Float64Array::from(&self.unpaired[..])
    }
    #[wasm_bindgen(getter)]
    pub fn paired_dimensions(&self) -> js_sys::Uint32Array {
        js_sys::Uint32Array::from(&self.paired_dimensions[..])
    }
    #[wasm_bindgen(getter)]
    pub fn unpaired_dimensions(&self) -> js_sys::Uint32Array {
        js_sys::Uint32Array::from(&self.unpaired_dimensions[..])
    }
}

// Do square root here
fn build_apd(
    diagram: PersistenceDiagram,
    f_times: Vec<f64>,
    dimensions: Vec<usize>,
) -> AlphaPersistenceDiagram {
    let mut paired = vec![];
    let mut unpaired = vec![];
    let mut paired_dimensions = vec![];
    let mut unpaired_dimensions = vec![];

    for (b_idx, d_idx) in diagram.paired {
        let b = f_times[b_idx];
        let d = f_times[d_idx];
        let dim = dimensions[b_idx];
        if b != d {
            paired.push(b);
            paired.push(d);
            paired_dimensions.push(dim as u32);
        }
    }

    for b_idx in diagram.unpaired {
        let b = f_times[b_idx];
        let dim = dimensions[b_idx];
        unpaired.push(b);
        unpaired_dimensions.push(dim as u32);
    }

    AlphaPersistenceDiagram {
        paired,
        unpaired,
        paired_dimensions,
        unpaired_dimensions,
    }
}

#[wasm_bindgen]
pub fn compute_alpha_persistence(points: &[f64]) -> AlphaPersistenceDiagram {
    let points: Vec<_> = points
        .chunks_exact(2)
        .map(|chunk| Point2::new(chunk[0], chunk[1]))
        .collect();
    let filtration = alphalpha::alpha_filtration(points);
    let (matrix, f_times) = alphalpha::sparsify(&filtration);
    // filtration times will be off - need to square root
    let f_times = f_times.into_iter().map(|t| t.sqrt()).collect();
    let dimensions: Vec<_> = matrix.iter().map(|col| col.dimension()).collect();
    let n_cols = matrix.len();
    let at = anti_transpose(&matrix);
    let diagram = LockingAlgorithm::decompose(at.into_iter(), None)
        .diagram()
        .anti_transpose(n_cols);
    build_apd(diagram, f_times, dimensions)
}
