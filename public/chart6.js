function fetchChart6Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart6?trackingId=${trackingId}`)
        .then(response => response.json())
        // .then(data => {
        //     // Extraire les données de latitude, longitude et adresse
        //     const coordinatesWithAddresses = data.addresses;

        //     // Créer des tableaux séparés pour les coordonnées
        //     const coordinates = coordinatesWithAddresses.map(coord => ({
        //         x: coord.longitude,
        //         y: coord.latitude,
        //         address: coord.address
        //     }));

        //     // Créer le graphique avec Chart.js
        //     const ctx = document.getElementById('trafficChart6').getContext('2d');
        //     const mapChart = new Chart(ctx, {
        //         type: 'scatter',
        //         data: {
        //             datasets: [{
        //                 label: 'Localisation des visiteurs',
        //                 data: coordinates,
        //                 backgroundColor: 'rgba(75, 192, 192, 0.6)',
        //                 pointRadius: 8,
        //                 pointHoverRadius: 10,
        //                 pointBackgroundColor: 'rgba(75, 192, 192, 1)'
        //             }]
        //         },
        //         options: {
        //             title: {
        //                 display: true,
        //                 text: 'Localisation des visiteurs'
        //             },
        //             scales: {
        //                 xAxes: [{
        //                     scaleLabel: {
        //                         display: true,
        //                         labelString: 'Longitude'
        //                     }
        //                 }],
        //                 yAxes: [{
        //                     scaleLabel: {
        //                         display: true,
        //                         labelString: 'Latitude'
        //                     }
        //                 }]
        //             },
        //             tooltips: {
        //                 callbacks: {
        //                     label: function (tooltipItem, data) {
        //                         const coord = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
        //                         return `${coord.address}`;
        //                     }
        //                 }
        //             }
        //         }
        //     });
        // })
        .then(data => {
            var ctx = document.getElementById('myChart').getContext('2d');
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                    datasets: [{
                        label: '# of Votes',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
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
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart6Data();
});
