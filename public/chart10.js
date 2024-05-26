function fetchChart10Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart10?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            // Calcul du nombre total d'utilisateurs
            const totalUsers = data.reduce((sum, item) => sum + item.user_count, 0);

            // Calcul des pourcentages pour chaque langue
            const labels = [];
            const percentages = [];
            data.forEach(item => {
                labels.push(item.language);
                const percentage = (item.user_count / totalUsers) * 100;
                percentages.push(parseFloat(percentage.toFixed(2))); // Supprimer le symbole de pourcentage
            });

            const purplePalette = [
                'hsla(303, 92%, 59%, 0.5)',
                'hsla(303, 86%, 72%, 0.5)',
                'hsla(303, 76%, 88%, 0.5)',
            ];

            const randomPurpleColor = () => {
                const index = Math.floor(Math.random() * purplePalette.length); // Sélectionner un index aléatoire dans le tableau
                return purplePalette[index]; // Retourner une couleur aléatoire de la palette
            };

            const backgroundColors = Array.from({ length: Object.keys(percentages).length }, randomPurpleColor);

            const ctx = document.getElementById('trafficChart10').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'pie', // Modifier le type de graphique en "doughnut"
                data: {
                    labels: labels, // Labels (langues)
                    datasets: [{
                        label: 'Pourcentage d\'utilisateurs par langue', // Étiquette du dataset
                        data: percentages, // Données (pourcentages)
                        backgroundColor: backgroundColors,
                        borderColor: '#f366ec', // Augmenter l'opacité pour le bord
                        borderWidth: 1
                    }]
                }
            });
        })
        .catch(error => {
            console.error('Une erreur s\'est produite:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart10Data();
});

