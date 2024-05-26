function fetchChart9Data() {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingId = urlParams.get('trackingId');

    if (!trackingId) {
        console.error('Aucun tracking_id trouvé dans l\'URL.');
        return;
    }

    fetch(`/chart9?trackingId=${trackingId}`)
        .then(response => response.json())
        .then(data => {
            if (!data || data.length === 0) {
                console.error('Les données sont vides ou non définies.');
                return;
            }

            const browsers = [...new Set(data.map(item => item.browser))]; // Obtenez les navigateurs uniques
            const countsByBrowser = {};

            browsers.forEach(browser => {
                countsByBrowser[browser] = 0;
            });

            data.forEach(item => {
                if (item.browser && countsByBrowser[item.browser] !== undefined) { // Vérifier si item.browser est défini
                    countsByBrowser[item.browser] += item.unique_userAgent;
                }
            });

            const totalUsers = Object.values(countsByBrowser).reduce((acc, curr) => acc + curr, 0);

            const percentages = {};
            Object.entries(countsByBrowser).forEach(([browser, count]) => {
                const percentage = (count / totalUsers) * 100;
                if (!isNaN(percentage) && percentage !== 0) { // Vérifier si le pourcentage est un nombre valide
                    percentages[browser] = percentage;
                }
            });

            const purplePalette = [
                'hsla(303, 92%, 59%, 0.5)',
                'hsla(303, 86%, 72%, 0.5)',
                'hsla(303, 76%, 88%, 0.5)',
                'hsla(335, 88%, 49%, 0.5)',

            ];

            const randomPurpleColor = () => {
                const index = Math.floor(Math.random() * purplePalette.length); // Sélectionner un index aléatoire dans le tableau
                return purplePalette[index]; // Retourner une couleur aléatoire de la palette
            };

            const backgroundColors = Array.from({ length: Object.keys(percentages).length }, randomPurpleColor);

            const ctx = document.getElementById('trafficChart9').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(percentages),
                    datasets: [{
                        label: 'Pourcentage d\'utilisateurs par navigateur',
                        data: Object.values(percentages),
                        backgroundColor: backgroundColors,
                        borderColor: '#f366ec', // Augmenter l'opacité pour le bord
                        borderWidth: 1
                    }]
                },
                options: {
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    return `${label}: ${value.toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Une erreur s\'est produite:', error);
        });

}

document.addEventListener('DOMContentLoaded', () => {
    fetchChart9Data();
});
