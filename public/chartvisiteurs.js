function fetchChartVisiteursData() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chartvisiteurs?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            const table = document.createElement('table');
            table.innerHTML = `
                <tbody>
                ${data.results.map(entry => `
                <tr>
                    <th><img class="accuiel" width="65px" src="./img/accuiel3.png"></th>
                    <th>Nombre pages visitées</th>
                    <th>Nombre de clicks </th>
                    <th> Dernière visite </th>
                    <th>Dernière page visitée</th>
                    <th>Page la plus visitée</th>
                    <th>Durée dernière visite</th>
                </tr>
                <tr>
                    <td></td>
                    <td>  ${entry.nombre_pages_visitees}</td>
                    <td>${entry.clicks}</td>
                    <td> ${entry.lastVisitTime} </td>
                    <td> ${entry.derniere_page_visitee}</td>
                    <td> ${entry.most_visited_page}  </td>
                    <td> ${data.results2.find(e => e.derniere_page_visitee === entry.derniere_page_visitee)?.duree_derniere_visite || ''}</td>
                </tr>
                `).join('')}
            </tbody>
            `;

            // Ajouter la table au DOM
            const container = document.getElementById('tableVisiteurs');
            container.innerHTML = '';
            container.appendChild(table);
        })
        .catch(error => {
            console.error('Une erreur s\'est produite lors de la récupération des données:', error);
        });
}


document.addEventListener('DOMContentLoaded', () => {
    fetchChartVisiteursData();
});


