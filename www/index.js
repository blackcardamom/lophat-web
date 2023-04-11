import * as Comlink from 'comlink';

async function getWorker() {
  return await Comlink.wrap(new Worker(new URL('./worker.js', import.meta.url)))
    .init;
}

function checkNumThreads(worker) {
  worker.getNumThreads().then((n_threads) => {
    console.log(`Rayon number of threads: ${n_threads}`);
  });
}

function setupForm(worker) {
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

async function init() {
  const worker = await getWorker();
  checkNumThreads(worker);
  setupForm(worker);
}

init();
