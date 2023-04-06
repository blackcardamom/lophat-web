import * as Comlink from 'comlink';
import init, {
  panic_init,
  initThreadPool,
  rayon_sum,
  rayon_n_threads,
  decompose_cycle_graph,
} from 'lophat-web';

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
  });
}

Comlink.expose({
  init: initFunctions(),
});
