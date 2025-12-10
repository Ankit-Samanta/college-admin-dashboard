const ctx2 = document.getElementById('chart2').getContext('2d');
new Chart(ctx2, {
  type: 'doughnut',
  data: {
    labels: ['Academic','Non-Academic','Administration','Others'],
    datasets: [{
      data: [42,12,8,6],
      backgroundColor: ['#2ecc71','#3498db','#f1c40f','#9b59b6'],
      borderWidth: 0
    }]
  },
  options: {
    responsive: true,
    plugins: { title: { display: false } }
  }
});
