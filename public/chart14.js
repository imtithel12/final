//chart14.js

document.addEventListener('DOMContentLoaded', () => {
    // Remplir les sélecteurs de date avec les options appropriées
    populateSelect('dayi1', 1, 31, currentDay);
    populateSelect('monthi1', 1, 12, currentMonth);
    populateSelect('yeari1', 2020, 2030, currentYear);

    // Remplir le sélecteur d'heure avec les options appropriées
    populateSelect('houri1', 0, 23, currentHour);

    // Ajouter des écouteurs d'événements change aux sélecteurs
    document.getElementById('dayi1').addEventListener('change', fetchChart14Data);
    document.getElementById('monthi1').addEventListener('change', fetchChart14Data);
    document.getElementById('yeari1').addEventListener('change', fetchChart14Data);
    document.getElementById('houri1').addEventListener('change', fetchChart14Data);

    // Afficher les données au chargement de la page
    fetchChart14Data();
});

function fetchChart14Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    const selectedDay = document.getElementById('dayi1').value;
    const selectedMonth = document.getElementById('monthi1').value;
    const selectedYear = document.getElementById('yeari1').value;
    const selectedHour = document.getElementById('houri1').value;

    fetch(`/chart4?trackingId=${trackingId}&dayi=${selectedDay}&monthi=${selectedMonth}&yeari=${selectedYear}&houri=${selectedHour}`)
        .then(response => response.json())
        .then(data => {
            // Créer le tableau HTML pour afficher les interactions par heure
            let tableHTML = '<table>';
            tableHTML += '<tr><th>Heure</th><th>Visites</th><th>Pages Visitées</th><th>Durée (seconds)</th><th>Utilisateurs</th></tr>';

            data.forEach(item => {
                tableHTML += `<tr><td>${item.hour_of_day}:00</td><td>${item.count}</td><td>${item.unique_pages_visited}</td><td>${item.duration_in_seconds}</td><td>${item.unique_userAgent}</td></tr>`;
            });

            tableHTML += '</table>';

            // Afficher le tableau dans un élément HTML avec l'id "hourlyInteractionsTable"
            document.getElementById('hourlyInteractionsTable').innerHTML = tableHTML;
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });
}

function populateSelect(id, start, end, selected) {
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


