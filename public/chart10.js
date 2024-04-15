fetch('/chart10/{{trackingId}}')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(item => item.event);
        const interactions = data.map(item => item.count);

        const ctx = document.getElementById('trafficChart').getContext('2d');
        const myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Nombre de visiteurs',
                    data: interactions,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Calculer le nombre total de visiteurs
        const totalCount = interactions.reduce((acc, curr) => acc + curr, 0);

        // Mettre à jour le texte avec le nombre total de visiteurs
        document.getElementById('totalCount').innerText = totalCount;
    })
    .catch(error => {
        console.error('Une erreur s\'est produite lors de la récupération des données:', error);
    });