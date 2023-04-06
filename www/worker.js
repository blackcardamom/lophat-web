import * as Comlink from 'comlink';
import init, {
  panic_init,
  initThreadPool,
  rayon_sum,
  rayon_n_threads,
  decompose_cycle_graph,
  compute_pairings,
} from 'lophat-web';

function flattenBoundaries(boundaries) {
  return boundaries.reduce(
    (accum, next_col) => {
      // This is where the next column starts
      const next_idx = accum.boundaries.length;
      accum.indexes.push(next_idx);
      // Push on next column
      accum.boundaries.push(...next_col);
      return accum;
    },
    { boundaries: [], indexes: [] }
  );
}

function formatPairings(flat_pairings) {
  let pairings = [];
  const chunkSize = 2;
  for (let i = 0; i < flat_pairings.length; i += chunkSize) {
    pairings.push(flat_pairings.slice(i, i + chunkSize));
  }
  return pairings;
}

async function initFunctions() {
  await init();
  panic_init();
  await initThreadPool(navigator.hardwareConcurrency);
  return Comlink.proxy({
    sumTheNumbers(numbers) {
      return rayon_sum(numbers);
    },
    getNumThreads() {
      return rayon_n_threads();
    },
    decomposeCycleGraph(n) {
      return decompose_cycle_graph(n);
    },
    computePairings(boundary_obj) {
      const flattened = flattenBoundaries(boundary_obj.boundaries);
      const dimensions = boundary_obj.dimensions;
      const flat_pairings = compute_pairings(
        flattened.boundaries,
        flattened.indexes,
        dimensions
      );
      return formatPairings(flat_pairings);
    },
  });
}

Comlink.expose({
  init: initFunctions(),
});
