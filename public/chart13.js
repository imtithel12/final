document.addEventListener('DOMContentLoaded', () => {
    const currentDate = new Date();
    const currentDayi = currentDate.getDate();
    const currentMonthi = currentDate.getMonth() + 1; // getMonth() returns 0-indexed months
    const currentYeari = currentDate.getFullYear();

    // Remplir les sélecteurs de date avec les options appropriées
    populateSelecti('dayi', 1, 31, currentDayi);
    populateSelecti('monthi', 1, 12, currentMonthi);
    populateSelecti('yeari', 2020, 2030, currentYeari);

    // Ajouter des écouteurs d'événements change aux sélecteurs de date
    document.getElementById('dayi').addEventListener('change', fetchChart4Data);
    document.getElementById('monthi').addEventListener('change', fetchChart4Data);
    document.getElementById('yeari').addEventListener('change', fetchChart4Data);

    // Afficher les données du jour actuel au chargement de la page
    fetchChart4Data();
});

function fetchChart4Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');
    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }
    const selectedDayi = document.getElementById('dayi').value;
    const selectedMonthi = document.getElementById('monthi').value;
    const selectedYeari = document.getElementById('yeari').value;

    fetch(`/chart4?trackingId=${trackingId}&dayi=${selectedDayi}&monthi=${selectedMonthi}&yeari=${selectedYeari}`)
        .then(response => response.json())
        .then(data => {
            const labels = [];
            const visitsData = [];
            const uniquePagesVisitedData = [];
            const durationInSecondsData = [];

            // Remplir les tableaux de données avec les valeurs correspondantes
            data.forEach(item => {
                labels.push(item.full_date);
                visitsData.push(item.count);
                uniquePagesVisitedData.push(item.unique_pages_visited);
                durationInSecondsData.push(item.duration_in_seconds);
            });

            // Récupérer le graphique existant ou créer un nouveau
            const ctx = document.getElementById('trafficChart4').getContext('2d');
            if (window.myChart) {
                window.myChart.destroy(); // Détruire le graphique existant pour le reconstruire avec les nouvelles données
            }
            window.myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Visites',
                        data: visitsData,
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Pages Visitées',
                        data: uniquePagesVisitedData,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Durée (secondes)',
                        data: durationInSecondsData,
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
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

function populateSelecti(id, start, end, selected) {
    const select = document.getElementById(id);
    select.innerHTML = '';
    for (let i = start; i <= end; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === selected) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}



