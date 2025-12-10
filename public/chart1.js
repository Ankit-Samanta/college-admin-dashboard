const ctx1 = document.getElementById('chart1').getContext('2d');
new Chart(ctx1, {
  type: 'line',
  data: {
    labels: ['2014','2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025'],
    datasets: [{
      label: 'Placed Students',
      data: [140,214,289,280,356,374,313,396,237,255,365,483],
      borderColor: 'rgb(41,155,99)',
      backgroundColor: 'rgba(41,155,99,0.2)',
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    plugins: { title: { display: false } },
    scales: { y: { beginAtZero:true } }
  }
});
