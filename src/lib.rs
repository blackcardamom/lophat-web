mod utils;

use lophat::VecColumn;
use wasm_bindgen::prelude::*;

pub use wasm_bindgen_rayon::init_thread_pool;

use lophat::rv_decompose;

use lophat::LoPhatOptions;

use lophat::DiagramReadOff;

use rayon::{current_num_threads, prelude::*};

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
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
pub fn decompose_cycle_graph(n: usize) -> Vec<usize> {
    let boundary_matrix_0 = (0..n).map(|i| (0 as usize, vec![]));
    let mut boundary_matrix_1: Vec<(usize, Vec<usize>)> =
        (1..n).map(|i| (1, vec![i - 1, i])).collect();
    boundary_matrix_1.push((1, vec![0, n - 1]));
    let boundary_matrix_2: Vec<(usize, Vec<usize>)> = vec![(2, (n..(2 * n)).collect())];
    let boundary_matrix = boundary_matrix_0
        .into_iter()
        .chain(boundary_matrix_1.into_iter())
        .chain(boundary_matrix_2.into_iter())
        .map(VecColumn::from);
    let decomp = rv_decompose(boundary_matrix, &LoPhatOptions::default());
    let diagram = decomp.diagram();
    let pairings: Vec<_> = diagram
        .paired
        .into_iter()
        .flat_map(|pair| vec![pair.0, pair.1])
        .collect();
    pairings
}
