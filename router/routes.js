const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const controller = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const controllerchart = require('../controllers/chartContraller');

const axios = require('axios');
const moment = require('moment');


router.get("/", (req, res) => {
    res.render("accueil")
});

router.get('/inscrire', controller.getInscrire);
router.post('/inscrire', controller.postInscrire);

router.get('/connecter', controller.getConnecter);
router.post('/connecter', controller.postConnecter);
router.post('/forgotPassword', controller.forgotPassword);

router.get('/forgotPassword', profileController.getForgotPassword);
// router.post('/forgotPassword', profileController.postForgotPassword);
// router.get('/resetPassword', profileController.getResetPassword);
// router.post('/resetPassword', profileController.postResetPassword);

router.get('/addurl', controller.getAddUrl);
router.post('/addurl', controller.postAddUrl);
router.get('/urls', controller.getUrls);
router.post('/deleteUrl', controller.deleteUrl);

router.get('/script', controller.getScript);

router.get('/clients', controller.getAllClients);


router.get('/logout', controller.getLogout);

router.get('/profile', controller.getProfile);

router.get('/updateProfile', controller.getUpdateProfile);
router.post('/updateProfile', controller.postUpdateProfile);

router.get('/updateProfilePassword', controller.getUpdateProfilePassword);
router.post('/updateProfilePassword', controller.postUpdateProfilePassword);

router.get('/projets', controller.getProjets);



// router.post('/api/track-interaction', (req, res) => {
//     const interactionData = req.body;

//     // Vérifie si interactionData est défini et contient la propriété 'event_type'
//     if (interactionData && interactionData.event_type) {
//         const formattedTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');

//         // Insérer les données dans la table interactions
//         db.query('INSERT INTO interactionss SET ?', {
//             event: interactionData.event_type,
//             element: interactionData.element,
//             timestamp: formattedTimestamp,
//             page: interactionData.page,
//             duration: interactionData.duration,
//             tracking_id: interactionData.tracking_id,
//             age: interactionData.age,
//             gender: interactionData.gender,
//             location: interactionData.location,
//             language: interactionData.language
//         }, (error, results, fields) => {
//             if (error) {
//                 console.error('Erreur lors de l\'insertion des données d\'interaction:', error);
//                 res.status(500).json({ error: 'Erreur lors de l\'insertion des données d\'interaction' });
//                 return;
//             }
//             console.log('Données d\'interaction insérées avec succès');
//             res.json({ message: 'Données d\'interaction insérées avec succès' });
//         });
//     } else {
//         console.error('Erreur lors de la réception des données d\'interaction: les données reçues sont invalides');
//         res.status(400).json({ error: 'Données d\'interaction invalides' });
//     }
// });

router.post('/api/track-interaction', (req, res) => {
    const interactionData = req.body;


    // Vérifie si interactionData est défini et contient la propriété 'event'
    if (interactionData && interactionData.event_type) {
        // Formater le timestamp avec Moment.js
        const formattedTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');

        // Insérer les données dans la table interactions
        db.query('INSERT INTO interactions SET ?', {
            //event: interactionData.event, 
            event: interactionData.event_type,
            element: interactionData.element,
            timestamp: formattedTimestamp,
            page: interactionData.page, // Assurez-vous que cette propriété est également envoyée depuis le client si elle est utilisée
            duration: interactionData.duration, // Assurez-vous que cette propriété est également envoyée depuis le client si elle est utilisée
            tracking_id: interactionData.tracking_id
        }, (error, results, fields) => {
            if (error) {
                console.error('Erreur lors de l\'insertion des données d\'interaction:', error);
                res.status(500).json({ error: 'Erreur lors de l\'insertion des données d\'interaction' });
                return;
            }
            console.log('Données d\'interaction insérées avec succès');
            res.json({ message: 'Données d\'interaction insérées avec succès' });
        });
    } else {
        // Si interactionData est indéfini ou ne contient pas la propriété 'event'
        console.error('Erreur lors de la réception des données d\'interaction: les données reçues sont invalides');
        res.status(400).json({ error: 'Données d\'interaction invalides' });
    }
});


router.get('/chart4', controllerchart.getChartData4);

router.get('/chart5', controllerchart.getChartData5);
router.get('/chart6', controllerchart.getChartData6);

router.get('/chart7', controllerchart.getChartData7);
router.get('/chart8', controllerchart.getChartData8);
router.get('/chart9', controllerchart.getChartData9);
router.get('/chart11', controllerchart.getChartData11);


router.get('/chart1', controllerchart.getChartData1);
router.get('/chart2', controllerchart.getChartData2);
router.get('/chart3', controllerchart.getChartData3);



router.get('/chart', controller.getChart);

module.exports = router;