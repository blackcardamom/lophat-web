import * as Comlink from 'comlink';
import { setupPointEditor, setupPersistenceDiagram } from './chart_maker';

async function getWorker() {
  return await Comlink.wrap(new Worker(new URL('./worker.js', import.meta.url)))
    .init;
}

async function checkNumThreads(worker) {
  n_threads = await worker.getNumThreads();
  console.log(`Rayon number of threads: ${n_threads}`);
  const span = document.getElementById('n_threads');
  span.innerText = n_threads;
}

function initBoundaryMatrixExample(worker) {
  const textarea = document.getElementById('boundary_matrix');
  const button = document.getElementById('compute');
  button.onclick = async (e) => {
    e.preventDefault();
    try {
      hideError();
      const boundary_obj = buildBoundaryObj(textarea.value);
      displayComputing();
      const diagram = await worker.computePairings(boundary_obj);
      displayDiagram(diagram);
    } catch (error) {
      displayError(error);
    }
  };
}

function buildBoundaryObj(boundary_str) {
  const parsed_rows = boundary_str
    .split('\n')
    .map((row) =>
      row
        .trim()
        .split(',')
        .map((str) => str.trim())
        .map(parseFloat)
        .filter((elem) => !isNaN(elem))
    )
    .filter((row) => row.length > 0);
  return parsed_rows.reduce(
    (boundary_obj, next_row) => {
      boundary_obj.dimensions.push(next_row[0]);
      boundary_obj.boundaries.push(next_row.slice(1));
      return boundary_obj;
    },
    { dimensions: [], boundaries: [] }
  );
}

function displayComputing() {
  const result_area = document.getElementById('result');
  result_area.innerText = 'Computing...';
}

// TODO: Display output in nicer format
function displayDiagram(diagram) {
  const result_area = document.getElementById('result');
  const paired_string = diagram.paired
    .map((pairing) => `(${pairing[0]}, ${pairing[1]})`)
    .join('\n');
  const unpaired_string = `Unpaired: ${diagram.unpaired.join(', ')}`;
  const diagram_string = 'Pairings:\n' + paired_string + '\n' + unpaired_string;
  result_area.innerText = diagram_string;
}

function displayError(error) {
  document.getElementById('problem').classList.remove('noshow');
  console.error(error);
}

function hideError() {
  const elem = document.getElementById('problem');
  if (!elem.classList.contains('noshow')) {
    elem.classList.add('noshow');
  }
}


function initAlphaExample(worker) {

  const N = 20;
  const R = 5;
  let points = [...Array(N).keys()].map(i => {
    return [R * Math.cos(2 * Math.PI * i / N), R * Math.sin(2 * Math.PI * i / N)]
  })

  let pd_chart_handle = setupPersistenceDiagram('pd-chartJSContainer');

  let refreshPersistenceDiagram = async function() {
    let diagram = await worker.computeAlphaPersistence(points);
    pd_chart_handle.data.datasets[0].data = diagram[0].map(pt => {
      return {x: pt[0], y: pt[1]}
    })
    pd_chart_handle.data.datasets[1].data = diagram[1].map(pt => {
      return {x: pt[0], y: pt[1]}
    })
    pd_chart_handle.update()
  }

  let dragCallback = (index, value) => {
    points[index][0] = value.x;
    points[index][1] = value.y;
    refreshPersistenceDiagram();
  }

  let chart_handle = setupPointEditor('chartJSContainer', points, dragCallback)
  refreshPersistenceDiagram();
}


async function init() {
  const worker = await getWorker();
  checkNumThreads(worker);
  initBoundaryMatrixExample(worker);
  initAlphaExample(worker)

}

init();
