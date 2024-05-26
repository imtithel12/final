function fetchChartVisiteursinData() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chartvisiteursin?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            // Extraire les données nécessaires pour le graphique
            const labels = data.map(item => item.country);
            const dataCounts = data.map(item => item.unique_userAgent);

            // Créer le graphique avec Chart.js
            const ctx = document.getElementById('userAgentChart').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nombre d\'utilisateurs uniques',
                        data: dataCounts,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)', // Couleur de remplissage des barres
                        borderColor: 'rgba(54, 162, 235, 1)', // Couleur des bordures des barres
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true // Commencer l'axe y à zéro
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });
}


document.addEventListener('DOMContentLoaded', () => {
    fetchChartVisiteursinData();
});


