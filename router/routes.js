const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const controller = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const controllerchart = require('../controllers/chartContraller');
const controllerrapport = require('../controllers/rapportController');

const axios = require('axios');
const moment = require('moment');

const getPageToday = require('../controllers/rapportController');
const getUserAgentToday = require('../controllers/rapportController');



router.get("/", (req, res) => {
    res.render("accueil")
});

router.get('/inscrire', controller.getInscrire);
router.post('/inscrire', controller.postInscrire);

router.get('/connecter', controller.getConnecter);
router.post('/connecter', controller.postConnecter);

router.get('/addurl', controller.getAddUrl);
router.post('/addurl', controller.postAddUrl);
router.get('/urls', controller.getUrls);
router.post('/deleteUrl/:id', controller.deleteUrl);
router.post('/deleteUrlp/:id', controller.deleteUrlp);

router.get('/script', controller.getScript);

router.get('/clients', controller.getAllClients);


router.get('/logout', controller.getLogout);

router.get('/profile', controller.getProfile);

router.get('/updateProfile', controller.getUpdateProfile);
router.post('/updateProfile', controller.postUpdateProfile);

router.get('/updateProfilePassword', controller.getUpdateProfilePassword);
router.post('/updateProfilePassword', controller.postUpdateProfilePassword);

router.get('/updateprofileurls', controller.getUpdateProfileUrls);

router.get('/projets', controller.getProjets);

// router.post('/api/track-interaction', (req, res) => {
//     const interactionData = req.body;

//     // Validate if the required event_type and page properties exist
//     if (!interactionData || !interactionData.event_type || !interactionData.page) {
//         console.error('Invalid interaction data received:', interactionData);
//         return res.status(400).json({ error: 'Invalid interaction data' });
//     }

//     // Use server-side timestamp for consistency
//     const formattedTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');

//     // Database insert query
//     db.query('INSERT INTO interactions SET ?', {
//         event: interactionData.event_type,
//         element: interactionData.element, // Optional: some events might not have this
//         timestamp: formattedTimestamp,
//         page: interactionData.page,
//         tracking_id: interactionData.tracking_id,
//         duration: interactionData.duration, // Optional: not all events will include duration
//         language: interactionData.language, // Optional: browser language
//         userAgent: interactionData.userAgent,
//         latitude: interactionData.latitude, // New: latitude data
//         longitude: interactionData.longitude // New: longitude data
//     }, (error, results) => {
//         if (error) {
//             console.error('Error inserting interaction data:', error);
//             return res.status(500).json({ error: 'Database error' });
//         }
//         console.log('Interaction data inserted successfully');
//         res.json({ message: 'Data stored successfully' });
//     });
// });


router.post('/api/track-interaction', (req, res) => {
    const interactionData = req.body;

    // Validate if the required event_type and page properties exist
    if (!interactionData || !interactionData.event_type || !interactionData.page) {
        console.error('Invalid interaction data received:', interactionData);
        return res.status(400).json({ error: 'Invalid interaction data' });
    }

    // Use server-side timestamp for consistency
    const formattedTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    // Extract data from localStorage
    const userType = req.body.userType;

    // Database insert query
    db.query('INSERT INTO interactions SET ?', {
        event: interactionData.event_type,
        element: interactionData.element, // Optional: some events might not have this
        timestamp: formattedTimestamp,
        page: interactionData.page,
        tracking_id: interactionData.tracking_id,
        duration: interactionData.duration, // Optional: not all events will include duration
        language: interactionData.language, // Optional: browser language
        userAgent: interactionData.userAgent,
        latitude: interactionData.latitude, // New: latitude data
        longitude: interactionData.longitude, // New: longitude data
        userType: userType, // New: user type from localStorage
        ip_address: interactionData.ipAddress
    }, (error, results) => {
        if (error) {
            console.error('Error inserting interaction data:', error);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log('Interaction data inserted successfully');
        res.json({ message: 'Data stored successfully' });
    });
});


router.get('/chart', controller.getChart);

router.get('/chart1', controllerchart.getChartData1);
router.get('/chart4', controllerchart.getChartData4);
router.get('/chart42', controllerchart.getChartData42);
router.get('/chart42p', controllerchart.getChartData42p);
router.get('/chart42s', controllerchart.getChartData42s);
router.get('/chartnew', controllerchart.getChartDatanew);
router.get('/chartnewp', controllerchart.getChartDatanewp);
router.get('/chart43', controllerchart.getChartData43);
router.get('/chartvisiteurs', controllerchart.getChartVisiteursData);
router.get('/chartvisiteursin', controllerchart.getChartVisiteursinData);
router.get('/chartvisiteursin2', controllerchart.getChartVisiteursin2Data);
router.get('/chartvisiteursin2', controllerchart.getChartVisiteursinData2);
router.get('/chartgeolocation', controllerchart.getGeolocation);
router.get('/chartpage', controllerchart.getChartPageData);


router.get('/chart2', controllerchart.getChartData2);
router.get('/chart5', controllerchart.getChartData5);
router.get('/chart7', controllerchart.getChartData7);
router.get('/chart77', controllerchart.getChartData77);
router.get('/chart9', controllerchart.getChartData9);
router.get('/chart10', controllerchart.getChartData10);
router.get('/chart11', controllerchart.getChartData11);
router.get('/chart12', controllerchart.getChartData12);


router.get('/rapport', controller.getRapportData);

module.exports = router;