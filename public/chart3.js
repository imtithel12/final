//chart3.js


// function fetchChart3Data() {
//     const urlParams = new URLSearchParams(window.location.search);
//     const trackingId = urlParams.get('trackingId');

//     if (!trackingId) {
//         console.error('Aucun tracking_id trouvé dans l\'URL.');
//         return;
//     }
//     const ctx = document.getElementById('trafficChart3').getContext('2d');

//     fetch(`/chart3?trackingId=${trackingId}`)
//         .then(response => response.json())
//         .then(data => {
//             const labels = data.map(item => item.page);
//             const durations = data.map(item => {
//                 // Assuming total_duration is returned in a readable format like "2h 15m 30s"
//                 const parts = item.total_duration.match(/(\d+)h (\d+)m (\d+)s/);
//                 return parseInt(parts[1]) * 60 + parseInt(parts[2]) + parseInt(parts[3]) / 60;
//             });

//             new Chart(ctx, {
//                 type: 'bar',
//                 data: {
//                     labels: labels,
//                     datasets: [{
//                         label: 'Total Duration (minutes)',
//                         data: durations,
//                         backgroundColor: 'rgba(54, 162, 235, 0.2)',
//                         borderColor: 'rgba(54, 162, 235, 1)',
//                         borderWidth: 1
//                     }]
//                 },
//                 options: {
//                     scales: {
//                         y: {
//                             beginAtZero: true,
//                             title: {
//                                 display: true,
//                                 text: 'Duration in Minutes'
//                             }
//                         }
//                     },
//                     responsive: true,
//                     plugins: {
//                         legend: {
//                             position: 'top',
//                         }
//                     }
//                 }
//             });
//         })
//         .catch(error => console.error('Error fetching data:', error));
// };


// document.addEventListener('DOMContentLoaded', () => {
//     fetchChart3Data();
// });


function fetchChart3Data() {
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
            const labels = data.map(item => item.page);
            const durations = data.map(item => {
                // Assuming total_duration is returned in a readable format like "2h 15m 30s"
                const parts = item.total_duration.match(/(\d+)h (\d+)m (\d+)s/);
                return parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseInt(parts[3]);
            });

            // Create the chart
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Total Duration (minutes)',
                        data: durations.map(duration => duration / 60), // Convert seconds to minutes
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
                                text: 'Duration in Minutes'
                            }
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

            const totalDurationSeconds = durations.reduce((acc, curr) => acc + curr, 0);
            document.getElementById('totalDuration3').innerText = formatDuration(totalDurationSeconds);
        })
        .catch(error => console.error('Error fetching data:', error));
};

function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}



document.addEventListener('DOMContentLoaded', () => {
    fetchChart3Data();
});
