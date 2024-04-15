fetch('/chart6')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.event);
        const durations = data.map(item => item.avg_duration);

        const ctx = document.getElementById('chart6').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Durée moyenne des interactions par événement',
                    data: durations,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)', // Couleur de fond
                    borderColor: 'rgba(54, 162, 235, 1)', // Couleur de ligne
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Durée moyenne des interactions par événement', // Titre du graphique
                        font: {
                            size: 16 // Taille de la police du titre
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Durée moyenne (en secondes)' // Titre de l'axe radial
                        }
                    }
                }
            }
        });
    });