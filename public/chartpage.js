function fetchChartPagesData() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chartpage?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            // Créer une chaîne HTML pour la table
            let tableHTML = '<table>';
            tableHTML += '<thead><tr><th></th><th>Page</th><th>Nombre de visiteurs</th><th>Nombre de vues</th><th>Nombre de clicks</th></tr></thead>';
            tableHTML += '<tbody>';

            // Parcourir les données et ajouter chaque entrée à la table
            data.forEach(entry => {
                tableHTML += `
                <tr>
                <td><img class="accuiel" width="65px" src="./img/accuielp.jpg"></td>
                <td>${entry.page}</td>
                <td class="center">${entry.unique_userAgent}</td>
                <td class="center">${entry.total_visits}</td>
                <td class="center">${entry.total_clicks}</td>
                </tr>`;
            });

            tableHTML += '</tbody></table>';

            // Ajouter la table générée au conteneur dans le DOM
            const container = document.getElementById('tablePage');
            container.innerHTML = tableHTML;
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });

}


document.addEventListener('DOMContentLoaded', () => {
    fetchChartPagesData();
});