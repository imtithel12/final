//hours day table

function fetchChart12Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart12?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            // Créer un objet pour stocker les totaux de chaque type de données par date
            const totalsByDate = {};

            // Remplir les données avec les valeurs correspondantes
            data.forEach((item, index) => {
                const date = new Date(item.full_date).toLocaleDateString(); // Récupérer la date sans l'heure
                if (!totalsByDate[date]) {
                    totalsByDate[date] = {
                        visits: 0,
                        uniquePagesVisited: 0,
                        durationInSeconds: 0,
                        totalUserAgents: 0
                    };
                }
                totalsByDate[date].visits += item.count;
                totalsByDate[date].uniquePagesVisited += item.unique_pages_visited;
                totalsByDate[date].durationInSeconds += item.duration_in_seconds;
                totalsByDate[date].totalUserAgents += item.unique_userAgent;

                // Ajouter le calcul de la durée par rapport à l'heure précédente
                if (index > 0) {
                    const prevDuration = data[index - 1].duration_in_seconds;
                    if (item.duration_in_seconds > prevDuration) {
                        totalsByDate[date].durationInSeconds += 100; // Augmenter la durée
                    } else if (item.duration_in_seconds < prevDuration) {
                        totalsByDate[date].durationInSeconds -= 100; // Diminuer la durée
                    }
                }
            });

            // Extraire les libellés des dates
            const labels = Object.keys(totalsByDate);

            // Extraire les données à partir de l'objet totalsByDate
            const visitsData = labels.map(date => totalsByDate[date].visits);
            const uniquePagesVisitedData = labels.map(date => totalsByDate[date].uniquePagesVisited);
            const durationInSecondsData = labels.map(date => totalsByDate[date].durationInSeconds);
            const totalUserAgentsData = labels.map(date => totalsByDate[date].totalUserAgents);

            // Créer le graphique avec Chart.js
            const ctx = document.getElementById('trafficChart12').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Utilisateurs',
                        data: totalUserAgentsData,
                        backgroundColor: 'rgba(255, 206, 86, 0.2)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4
                    }, {
                        label: 'Pages Visitées',
                        data: uniquePagesVisitedData,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4
                    }, {
                        label: 'Séances',
                        data: visitsData,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4,
                    }, {
                        label: 'Durée (seconds)',
                        data: durationInSecondsData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4
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
        })
        .catch(error => {
            console.error('Une erreur s\'est produite:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart12Data();
});




