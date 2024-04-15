document.addEventListener('DOMContentLoaded', function () {
    // Stockage du timestamp de début de la visite
    var startTime = Math.floor(new Date().getTime() / 1000);

    function sendData(data) {
        fetch('/api/track-interaction', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Data sent successfully:', data);
            })
            .catch(error => {
                console.error('Error sending data:', error);
            });
    }

    // Événement déclenché lorsqu'une page est chargée
    window.addEventListener('load', function () {
        // Calcul de la durée de la visite
        var endTime = Math.floor(new Date().getTime() / 1000);
        var visitDuration = endTime - startTime;

        // Envoi des données de la visite
        sendData({ event_type: 'visit', page: window.location.href, duration: visitDuration });
    });

    // Événement déclenché lorsqu'une page est quittée
    window.addEventListener('beforeunload', function () {
        // Calcul de la durée de la visite
        var endTime = Math.floor(new Date().getTime() / 1000);
        var visitDuration = endTime - startTime;

        // Envoi des données de la visite
        sendData({ event_type: 'leave', page: window.location.href, duration: visitDuration });
    });

    // Capturer les clics sur chaque lien dans le document
    document.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            // Envoi des données du clic sur le lien avec l'élément spécifié comme "link"
            sendData({ event_type: 'click', element: 'link', timestamp: Math.floor(new Date().getTime() / 1000), page: link.href });
        });
    });

    // Capturer les clics sur chaque bouton dans le document
    document.querySelectorAll('button').forEach(function (button) {
        button.addEventListener('click', function () {
            // Envoi des données du clic sur le bouton avec l'élément spécifié comme "button"
            sendData({ event_type: 'click', element: 'button', timestamp: Math.floor(new Date().getTime() / 1000), page: window.location.href });
        });
    });
});

