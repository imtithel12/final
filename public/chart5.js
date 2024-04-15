fetch('/chart5')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.date);
        const interactions = data.map(item => item.total_interactions);

        const ctx = document.getElementById('chart5').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Interactions',
                    data: interactions,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Évolution du nombre total d\'interactions', // Titre du graphique
                        font: {
                            size: 16
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Nombre d\'interactions' // Titre de l'axe Y
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date' // Titre de l'axe X
                        }
                    }
                }
            }
        });
    });