function convertSecondsToHMS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function fetchChart11Data(month1) {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');
    const currentYear1 = new Date().getFullYear();

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    // Effectuer la requête avec les paramètres du mois sélectionné
    fetch(`/chart1?trackingId=${trackingId}&month1=${month1}&year1=${currentYear1}`)
        .then(response => response.json())
        .then(data => {
            // Récupérer les libellés à partir des données du serveur
            const labels = data.map(item => item.full_date);
            const totalUserAgentsData = data.map(item => item.unique_userAgent);
            const uniquePagesVisitedData = data.map(item => item.unique_pages_visited);
            const visitsData = data.map(item => item.count);
            const durationInSecondsData = data.map(item => item.duration_in_seconds);
            const durationData = data.map(item => item.duration);

            // Mettre à jour le graphique avec les nouvelles données
            const ctx = document.getElementById('trafficChart11').getContext('2d');
            if (window.myChart !== undefined) {
                window.myChart.destroy(); // Détruire le graphique existant pour le reconstruire avec les nouvelles données
            }
            window.myChart = new Chart(ctx, {
                type: 'line',
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
                        backgroundColor: 'rgba(209, 92, 233, 0.2)',
                        borderColor: 'rgb(210, 92, 233)',
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
            const totalCount1 = totalUserAgentsData.reduce((acc, curr) => acc + curr, 0);
            document.getElementById('totalCount1').innerText = totalCount1;

            const totalCount2 = uniquePagesVisitedData.reduce((acc, curr) => acc + curr, 0);
            document.getElementById('totalCount2').innerText = totalCount2;

            const totalCount3 = visitsData.reduce((acc, curr) => acc + curr, 0);
            document.getElementById('totalCount3').innerText = totalCount3;

            const totalCountInSeconds = durationData.reduce((acc, curr) => acc + curr, 0);
            const formattedTotalDuration = convertSecondsToHMS(totalCountInSeconds);
            document.getElementById('totalCount4').innerText = formattedTotalDuration;

        })

        .catch(error => {
            console.error('Une erreur s\'est produite:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    // Récupérer la valeur initiale du mois
    const selected = document.getElementById('month1').value;
    fetchChart11Data(selected);

    // Gestionnaire d'événements pour le changement de mois sélectionné
    document.getElementById('month1').addEventListener('change', (event) => {
        const selected = event.target.value;
        fetchChart11Data(selected);
    });
});

