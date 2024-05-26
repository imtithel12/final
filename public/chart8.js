function fetchChart8Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart7?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            const table = document.createElement('table');
            table.classList.add('data-table');

            // En-tête du tableau
            const headerRow = table.insertRow();
            const headers = ['Heure', 'Sessions', 'Durée (seconde)'];
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });

            // Remplissage des données
            for (let i = 0; i < data.length; i++) {
                const rowData = data[i];
                const row = table.insertRow();

                const hour = rowData.hour;
                const formattedHour = ("0" + hour).slice(-2);
                const timeCell = row.insertCell();
                timeCell.textContent = `${formattedHour}:00`;

                const visitsCell = row.insertCell();
                visitsCell.textContent = rowData.count;

                const durationCell = row.insertCell();
                durationCell.textContent = rowData.duration_in_seconds;
            }

            // Ajout du tableau à l'élément avec l'id 'table-container'
            const tableContainer = document.getElementById('table-container');
            tableContainer.innerHTML = '';
            tableContainer.appendChild(table);
        })
        .catch(error => {
            console.error('Une erreur s\'est produite:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart8Data();
});
