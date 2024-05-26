//chart5.js


function fetchChart5Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    const ctx = document.getElementById('trafficChart5').getContext('2d');

    fetch(`/chart5?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            const labels = data.map(item => item.page);
            const visitsData = data.map(item => item.visits);

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Visites',
                        data: visitsData,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Erreur lors de la récupération des données:', error));
};


document.addEventListener('DOMContentLoaded', () => {
    fetchChart5Data();
});