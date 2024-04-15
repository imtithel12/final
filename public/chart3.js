function fetchChart2Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    const ctx = document.getElementById('trafficChart3').getContext('2d');

    fetch(`/chart3?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            const ages = data.map(item => `${item.age} ans`);
            const counts = data.map(item => item.count);

            const chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ages,
                    datasets: [{
                        label: 'Nombre de visiteurs par tranche d\'âge',
                        data: counts,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
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
        })
        .catch(error => {
            console.error('Error fetching the demographic data:', error);
        });
};


document.addEventListener('DOMContentLoaded', () => {
    fetchChart3Data();
});
