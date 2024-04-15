fetch('/chart7')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.page);
        const interactions = data.map(item => item.total_interactions);

        const ctx = document.getElementById('chart7').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Interactions',
                    data: interactions,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)',
                        'rgba(255, 159, 64, 0.5)',
                        'rgba(255, 99, 132, 0.5)',
                    ], // Couleurs de fond pour chaque tranche du graphique
                    borderColor: 'rgba(255, 255, 255, 1)', // Couleur de bordure
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Répartition des interactions par page', // Titre du graphique
                        font: {
                            size: 16 // Taille de la police du titre
                        }
                    }
                }
            }
        });
    });