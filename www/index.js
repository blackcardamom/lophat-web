import * as Comlink from 'comlink';

async function getWorker() {
  return await Comlink.wrap(new Worker(new URL('./worker.js', import.meta.url)))
    .init;
}

async function init() {
  const worker = await getWorker();
  const my_numbers = [1, 3, 10];
  const result = await worker.sumTheNumbers(my_numbers);
  console.log(result);
  const n_threads = await worker.getNumThreads();
  console.log(n_threads);
  const my_numbers2 = [1, 3, 10, 29];
  const result2 = await worker.sumTheNumbers(my_numbers2);
  console.log(result2);
  const pairing = await worker.decomposeCycleGraph(1000000);
  console.log(pairing);
  console.log(pairing.length);
}

init();
