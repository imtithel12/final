function convertSecondsToHMS_Months(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function createGradientt(ctx, colors) {
    const gradientt = ctx.createLinearGradient(0, 0, 0, 400);
    gradientt.addColorStop(0, colors[0]);
    gradientt.addColorStop(0.5, colors[1]);
    gradientt.addColorStop(1, colors[2]);
    return gradientt;
}

function fetchChartallData() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart43?trackingId=${trackingId}`)
        .then(response => response.json())
        // .then(data => {
        //     const labels = ['Visiteurs', 'Pages Visitées', 'Sessions', 'Durée (seconds)'];

        //     const userAgentCount = data.reduce((acc, curr) => acc + curr.unique_userAgent, 0);
        //     const visitsDataCount = data.reduce((acc, curr) => acc + curr.unique_pages_visited, 0);
        //     const uniquePagesVisitedDataCount = data.reduce((acc, curr) => acc + curr.count, 0);
        //     const durationSecondDataCount = data.reduce((acc, curr) => acc + curr.duration_in_seconds, 0);
        //     const durationDataCount = data.reduce((acc, curr) => acc + curr.duration, 0);
        //     const formattedTotalDuration = convertSecondsToHMS_Months(durationDataCount);

        //     // Créer le graphique avec Chart.js
        //     const ctx = document.getElementById('userAgentChart').getContext('2d');

        //     // Création du gradient de fond
        //     const gradientt = createGradientt(ctx, ['rgb(243, 212, 247)', '#DA70D6', '#DA70D6']);

        //     const myChart = new Chart(ctx, {
        //         type: 'bar',
        //         data: {
        //             labels: labels,
        //             datasets: [{
        //                 label: 'Nombre',
        //                 data: [userAgentCount, visitsDataCount, uniquePagesVisitedDataCount, durationSecondDataCount],
        //                 backgroundColor: gradientt, // Utilisation du gradient créé pour le fond du graphique
        //                 borderColor: gradientt, // Couleur de l'espace entre les courbes
        //                 borderWidth: 1,
        //                 fill: false,
        //                 tension: 0.4,
        //             }]
        //         },
        //     });


        //     document.getElementById('viteurstotales').innerText = userAgentCount;
        //     document.getElementById('visitsDataCount').innerText = visitsDataCount;
        //     document.getElementById('uniquePagesVisitedDataCount').innerText = uniquePagesVisitedDataCount;
        //     document.getElementById('durationDataCount').innerText = formattedTotalDuration;
        // })
        .then(data => {
            const labels = ['Visiteurs', 'Pages Visitées', 'Sessions', 'Durée (seconds)'];

            const userAgentCount = data.reduce((acc, curr) => acc + curr.unique_userAgent, 0);
            const visitsDataCount = data.reduce((acc, curr) => acc + curr.unique_pages_visited, 0);
            const uniquePagesVisitedDataCount = data.reduce((acc, curr) => acc + curr.count, 0);
            const durationSecondDataCount = data.reduce((acc, curr) => acc + curr.duration_in_seconds, 0);
            const durationDataCount = data.reduce((acc, curr) => acc + curr.duration, 0);
            const formattedTotalDuration = convertSecondsToHMS_Months(durationDataCount);

            const ctx = document.getElementById('userAgentChart').getContext('2d');

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        label: 'Visiteurs',
                        data: [userAgentCount],
                        backgroundColor: ['#c556f1'],
                        borderColor: ['#c556f1'],
                        hoverOffset: 4
                    }, {
                        label: 'Pages Visitées',
                        data: [visitsDataCount],
                        backgroundColor: ['#CF77F1'],
                        borderColor: ['#CF77F1'],
                        hoverOffset: 4
                    }, {
                        label: 'Sessions',
                        data: [uniquePagesVisitedDataCount],
                        backgroundColor: ['#d98df7'],
                        borderColor: ['#d98df7'],
                        hoverOffset: 4
                    }, {
                        label: 'Durée (seconds)',
                        data: [durationSecondDataCount],
                        backgroundColor: ['#E3B1F8'],
                        borderColor: ['#E3B1F8'],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    label += context.raw;
                                    return label;
                                }
                            }
                        }
                    }
                }
            });

            // Mettre à jour les valeurs dans les éléments HTML
            document.getElementById('viteurstotales').innerText = userAgentCount;
            document.getElementById('visitsDataCount').innerText = visitsDataCount;
            document.getElementById('uniquePagesVisitedDataCount').innerText = uniquePagesVisitedDataCount;
            document.getElementById('durationDataCount').innerText = formattedTotalDuration;
        });



}

document.addEventListener('DOMContentLoaded', () => {
    fetchChartallData();
});





