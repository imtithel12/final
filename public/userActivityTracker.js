// document.addEventListener('DOMContentLoaded', function () {
//     // Stockage du timestamp de début de la visite
//     var startTime = Math.floor(new Date().getTime() / 1000);

//     function sendData(data) {
//         fetch('/api/track-interaction', {
//             method: 'POST',
//             mode: 'cors',
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(data)
//         })
//             .then(response => {
//                 if (!response.ok) {
//                     throw new Error('Network response was not ok');
//                 }
//                 return response.json();
//             })
//             .then(data => {
//                 console.log('Data sent successfully:', data);
//             })
//             .catch(error => {
//                 console.error('Error sending data:', error);
//             });
//     }

//     // Événement déclenché lorsqu'une page est chargée
//     window.addEventListener('load', function () {
//         // Calcul de la durée de la visite
//         var endTime = Math.floor(new Date().getTime() / 1000);
//         var visitDuration = endTime - startTime;

//         // Envoi des données de la visite
//         sendData({ event_type: 'visit', page: window.location.href, duration: visitDuration });
//     });

//     // Événement déclenché lorsqu'une page est quittée
//     window.addEventListener('beforeunload', function () {
//         // Calcul de la durée de la visite
//         var endTime = Math.floor(new Date().getTime() / 1000);
//         var visitDuration = endTime - startTime;

//         // Envoi des données de la visite
//         sendData({ event_type: 'leave', page: window.location.href, duration: visitDuration });
//     });

//     // Capturer les clics sur chaque lien dans le document
//     document.querySelectorAll('a').forEach(function (link) {
//         link.addEventListener('click', function () {
//             // Envoi des données du clic sur le lien avec l'élément spécifié comme "link"
//             sendData({ event_type: 'click', element: 'link', timestamp: Math.floor(new Date().getTime() / 1000), page: link.href });
//         });
//     });

//     // Capturer les clics sur chaque bouton dans le document
//     document.querySelectorAll('button').forEach(function (button) {
//         button.addEventListener('click', function () {
//             // Envoi des données du clic sur le bouton avec l'élément spécifié comme "button"
//             sendData({ event_type: 'click', element: 'button', timestamp: Math.floor(new Date().getTime() / 1000), page: window.location.href });
//         });
//     });
// });


// document.addEventListener('DOMContentLoaded', function () {
//     var startTime = Math.floor(new Date().getTime() / 1000);

//     function addBrowserInfo(data) {
//         data.language = navigator.language || navigator.userLanguage; // Browser language
//         data.userAgent = navigator.userAgent; // Browser and operating system information
//     }

//     function addGeolocation(data, callback) {
//         if (navigator.geolocation) {
//             navigator.geolocation.getCurrentPosition(function (position) {
//                 data.latitude = position.coords.latitude;
//                 data.longitude = position.coords.longitude;
//                 callback(data);
//             }, function (error) {
//                 console.error('Geolocation error:', error);
//                 data.latitude = "Unavailable";
//                 data.longitude = "Unavailable";
//                 callback(data);
//             });
//         } else {
//             console.error('Geolocation is not supported by this browser.');
//             data.latitude = "Unsupported";
//             data.longitude = "Unsupported";
//             callback(data);
//         }
//     }

//     function sendData(data) {
//         data.tracking_id = trackingId;
//         addBrowserInfo(data);
//         addGeolocation(data, function (enrichedData) {
//             fetch('/api/track-interaction', {
//                 method: 'POST',
//                 mode: 'cors',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(enrichedData)
//             })
//                 .then(response => {
//                     if (!response.ok) {
//                         throw new Error('Network response was not ok');
//                     }
//                     return response.json();
//                 })
//                 .then(data => {
//                     console.log('Data sent successfully:', data);
//                 })
//                 .catch(error => {
//                     console.error('Error sending data:', error);
//                 });
//         });
//     }

//     window.addEventListener('load', function () {
//         var endTime = Math.floor(new Date().getTime() / 1000);
//         var visitDuration = endTime - startTime;
//         sendData({ event_type: 'visit', page: window.location.href, duration: visitDuration });
//     });

//     window.addEventListener('beforeunload', function () {
//         var endTime = Math.floor(new Date().getTime() / 1000);
//         var visitDuration = endTime - startTime;
//         sendData({ event_type: 'leave', page: window.location.href, duration: visitDuration });
//     });

//     document.querySelectorAll('a').forEach(function (link) {
//         link.addEventListener('click', function () {
//             sendData({ event_type: 'click', element: 'link', timestamp: Math.floor(new Date().getTime() / 1000), page: link.href });
//         });
//     });

//     document.querySelectorAll('button').forEach(function (button) {
//         button.addEventListener('click', function () {
//             sendData({ event_type: 'click', element: 'button', timestamp: Math.floor(new Date().getTime() / 1000), page: window.location.href });
//         });
//     });
// });
