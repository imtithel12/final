//chart1.js

function fetchChart1Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart1?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            // Récupérer les données
            const labels = []; // Tableau pour les étiquettes (jour de la semaine et mois)
            const interactions = []; // Tableau pour stocker le nombre de visiteurs pour chaque jour

            // Parcourir les données et extraire les informations nécessaires
            data.forEach(item => {
                // Construire l'étiquette avec le jour de la semaine et le mois
                const label = `${item.full_date},${item.day_of_week}`;
                labels.push(label);

                // Ajouter le nombre de visiteurs pour ce jour
                interactions.push(item.count);
            });

            const ctx = document.getElementById('trafficChart1').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Nombre de visiteurs par Jours',
                        data: interactions,
                        fill: true,
                        backgroundColor: '#7c067879',
                        borderColor: '#7c0678',
                        borderWidth: 2
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Nombre de visiteurs'
                            }
                        }
                    }
                }
            });

            const totalCount1 = interactions.reduce((acc, curr) => acc + curr, 0);
            document.getElementById('totalCount1').innerText = totalCount1;
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart1Data();
});


// function fetchChart1Data() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const trackingId = urlParams.get('trackingId');

//     if (!trackingId) {
//         console.error('Aucun tracking_id trouvé dans l\'URL.');
//         return;
//     }

//     fetch(`/chart1?trackingId=${trackingId}`)
//         .then(response => response.json())
//         .then(data => {
//             // Récupérer les données
//             const labels = []; // Tableau pour les étiquettes (jour complet)
//             const counts = []; // Tableau pour stocker le nombre de visiteurs

//             // Parcourir les données et extraire les informations nécessaires
//             data.forEach(item => {
//                 // Construire l'étiquette avec la date complète
//                 const label = `${item.full_date} (${item.day_of_week})`;
//                 labels.push(label);

//                 // Ajouter le nombre de visiteurs pour cette date
//                 counts.push(item.count);
//             });

//             const ctx = document.getElementById('trafficChart1').getContext('2d');
//             const myChart = new Chart(ctx, {
//                 type: 'bar', // Utilisation d'un diagramme en barres pour ce cas
//                 data: {
//                     labels: labels,
//                     datasets: [{
//                         label: 'Nombre de visiteurs par date',
//                         data: counts,
//                         backgroundColor: 'rgba(75, 192, 192, 0.2)',
//                         borderColor: 'rgba(75, 192, 192, 1)',
//                         borderWidth: 1
//                     }]
//                 },
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true
//                         }
//                     }
//                 }
//             });
//             const totalCount1 = differences.reduce((acc, curr) => acc + curr, 0);
//             document.getElementById('totalCount1').innerText = totalCount1;
//         })
//         .catch(error => {
//             console.error('Une erreur s\'est produite lors de la récupération des données:', error);
//         });
// }

// document.addEventListener('DOMContentLoaded', () => {
//     fetchChart1Data();
// });
