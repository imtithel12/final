//chart2.js


function fetchChart2Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart2?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Données récupérées:', data);
            // Initialisation des compteurs pour chaque statut
            let countIncreased = 0;
            let countDecreased = 0;
            let countStable = 0;

            // Compter chaque statut
            data.forEach((weekData) => {
                switch (weekData.status) {
                    case 'augmenté':
                        countIncreased++;
                        break;
                    case 'diminué':
                        countDecreased++;
                        break;
                    case 'stable':
                        countStable++;
                        break;
                    // Pas besoin de 'default' puisque tous les cas sont couverts
                }
            });

            const ctx = document.getElementById('trafficChart2').getContext('2d');
            const statusChart = new Chart(ctx, {
                type: 'doughnut', // Utilisez 'doughnut' pour un graphique en anneau
                data: {
                    labels: ['Augmenté', 'Diminué', 'Stable'],
                    datasets: [{
                        label: 'Statut par semaine',
                        data: [countIncreased, countDecreased, countStable],
                        backgroundColor: [
                            'rgba(75, 192, 192, 1)', // Vert pour augmenté
                            'rgba(255, 99, 132, 1)', // Rouge pour diminué
                            'rgba(255, 206, 86, 1)' // Jaune pour stable
                        ],
                        borderColor: [
                            'rgba(255, 255, 255, 1)', // Bordure blanche pour tous
                            'rgba(255, 255, 255, 1)',
                            'rgba(255, 255, 255, 1)'
                        ],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    cutout: '75%',
                }
            });
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart2Data();
});
