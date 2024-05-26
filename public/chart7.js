// chart1.js



function fetchChart7Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart7?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            const labels = [];
            const visitsData = [];
            const uniquePagesVisitedData = [];
            const durationInSecondsData = [];
            const totalUserAgentsData = [];

            // Générer les étiquettes pour les 5 dernières heures
            for (let i = 4; i >= 0; i--) {
                const date = new Date();
                date.setHours(date.getHours() - i);
                const hour = date.getHours();
                const formattedHour = ("0" + hour).slice(-2); // Formatage de l'heure avec des zéros devant si nécessaire
                labels.push(`${formattedHour}:00`);
            }

            // Remplir les données si des résultats sont disponibles
            if (data.length > 0) {
                data.forEach(item => {
                    const hour = parseInt(item.hour);
                    const index = labels.indexOf(`${hour}:00`);
                    if (index !== -1) {
                        visitsData[index] = item.count;
                        uniquePagesVisitedData[index] = item.unique_pages_visited;
                        durationInSecondsData[index] = item.duration_in_seconds;
                        totalUserAgentsData[index] = item.unique_userAgent;
                    }
                });
            } else {
                // Si les données sont vides, remplir les tableaux avec des zéros
                for (let i = 0; i < 5; i++) {
                    visitsData.push(0);
                    uniquePagesVisitedData.push(0);
                    durationInSecondsData.push(0);
                    totalUserAgentsData.push(0);
                }
            }

            // Créer le graphique avec Chart.js
            const ctx = document.getElementById('trafficChart7').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Sessions',
                        data: visitsData,
                        backgroundColor: 'rgba(230, 13, 230, 0.363)',
                        borderColor: 'rgb(230, 13, 230)',
                        borderWidth: 1,
                        fill: false,
                        tension: 0.4,
                        pointStyle: 'cross'
                    }, {
                        label: 'Durée (seconde)',
                        data: durationInSecondsData,
                        backgroundColor: 'rgba(230, 208, 13, 0.377)',
                        borderColor: 'rgb(230, 208, 13)',
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
    fetchChart7Data();
});
