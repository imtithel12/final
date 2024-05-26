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
            const labels = [];
            const uniquePagesVisited = [];

            data.forEach(item => {
                labels.push(item.full_date);
                uniquePagesVisited.push(item.unique_pages_visited);
            });

            const ctx = document.getElementById('trafficChart1').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Pages visitées uniques par jour',
                        data: uniquePagesVisited,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Nombre de pages visitées'
                            }
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
    fetchChart2Data();
});
