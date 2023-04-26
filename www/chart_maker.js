import Chart from 'chart.js/auto'
import 'chartjs-plugin-dragdata'

function buildData(points) {
  return points.map(pt => { return { x: pt[0], y: pt[1], r: 5 } })
}

function setupPersistenceDiagram(id) {
  var options = {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Dimension 0',
          data: [],
          borderWidth: 1,
          backgroundColor: 'red'
        },
        {
          label: 'Dimension 1',
          data: [],
          borderWidth: 1,
          backgroundColor: 'blue'
        },
      ]
    },
    options: {
      scales: {
        y: { min: -0.1, max: 10 }, x: { min: -0.1, max: 10 }
      },
      elements: {
        point: {
          radius: 5
        }
      },
      responsive: false
    }
  };
  var ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, options);

}

function setupPointEditor(id, points, dragCallback) {
  var options = {
    type: 'bubble',
    data: {
      datasets: [
        {
          label: 'Bubble',
          data: buildData(points),
          borderWidth: 1,
          backgroundColor: 'rgb(189, 80, 105, 1)',
          pointHitRadius: 25
        }
      ]
    },
    options: {
      scales: {
        y: {
          max: 10,
          min: -10
        },
        x: {
          max: 10,
          min: -10
        }
      },
      responsive: false,
      onHover: function(e) {
        const point = e.chart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, false)
        if (point.length) e.native.target.style.cursor = 'grab'
        else e.native.target.style.cursor = 'default'
      },
      plugins: {
        legend: false,
        dragData: {
          round: 2,
          dragX: true,
          showTooltip: true,
          onDragStart: function(e) {
            // console.log(e)
          },
          onDrag: function(e, datasetIndex, index, value) {
            e.target.style.cursor = 'grabbing'
            dragCallback(index, value)
          },
          onDragEnd: function(e, datasetIndex, index, value) {
            e.target.style.cursor = 'default'
            // console.log(datasetIndex, index, value)
          }
        }
      }
    }
  }

  var ctx = document.getElementById(id).getContext('2d');
  return new Chart(ctx, options);
}



export { setupPointEditor, setupPersistenceDiagram }