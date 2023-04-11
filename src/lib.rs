mod utils;

use wasm_bindgen::prelude::*;
pub use wasm_bindgen_rayon::init_thread_pool;

use lophat::{
    anti_transpose, anti_transpose_diagram, rv_decompose, DiagramReadOff, LoPhatOptions,
    PersistenceDiagram, VecColumn,
};
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

// TODO: Figure out how to return paired and unpaired
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
    let options = LoPhatOptions::default();
    let decomp = rv_decompose(at.into_iter(), &options);
    let diagram = anti_transpose_diagram(decomp.diagram(), n_cols);
    diagram.into()
}
