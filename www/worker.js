import * as Comlink from 'comlink';
import init, {
  panic_init,
  initThreadPool,
  rayon_sum,
  rayon_n_threads,
  compute_pairings,
  compute_alpha_persistence
} from 'lophat-web';

const EPSILON = 0.0001;

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

function formatFloatDiagram(float_diagram) {
  // We only have dim 0 and 1
  // We ignore unpaired (single infinite 0-dim feature)
  let diagram = [[], []];
  let dim_list = float_diagram.paired_dimensions;
  let pairings = float_diagram.paired;
  for (let i = 0; i < dim_list.length; i++) {
    let dim = dim_list[i];
    let b = pairings[2 * i];
    let d = pairings[2 * i + 1];
    if (d - b > EPSILON) {
      diagram[dim].push([b, d])
    }
  }
  return diagram
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
    computePairings(boundary_obj) {
      const flattened = flattenBoundaries(boundary_obj.boundaries);
      const dimensions = boundary_obj.dimensions;
      const flat_pairings = compute_pairings(
        flattened.boundaries,
        flattened.indexes,
        dimensions
      );
      return {
        paired: formatPairings(flat_pairings.paired),
        unpaired: flat_pairings.unpaired,
      };
    },
    computeAlphaPersistence(points) {
      const float_diagram = compute_alpha_persistence(points.flat());
      return formatFloatDiagram(float_diagram)
    }
  });
}

Comlink.expose({
  init: initFunctions(),
});
