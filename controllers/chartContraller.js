
const Chart = require('chart.js');

const db = require('../config/database');

let loggedInClientId = null;

const handlebars = require('handlebars');

// Charger le contenu du fichier .hbs
const fs = require('fs');
const template = fs.readFileSync('views/chart.hbs', 'utf8');


exports.getChartData4 = (req, res) => {
    db.query("SELECT page, SUM(duration) as total_duration FROM interactions WHERE event = 'visit' GROUP BY page", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};
exports.getChartData5 = (req, res) => {
    db.query("SELECT DATE(timestamp) as date, COUNT(*) as total_interactions FROM interactions GROUP BY date", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};
exports.getChartData6 = (req, res) => {
    db.query("SELECT event, AVG(duration) as avg_duration FROM interactions GROUP BY event", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};
exports.getChartData7 = (req, res) => {
    db.query("SELECT page, COUNT(*) as total_interactions FROM interactions WHERE event = 'visit' GROUP BY page", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};
exports.getChartData8 = (req, res) => {
    db.query("SELECT DAYOFWEEK(timestamp) as day_of_week, COUNT(*) as total_interactions FROM interactions GROUP BY day_of_week", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};
exports.getChartData9 = (req, res) => {
    db.query("SELECT   element, COUNT(*) AS total_interactions FROM   interactions GROUP BY element;", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};
// exports.getChartData10 = (req, res) => {
//     db.query("SELECT event, COUNT(*) as count FROM interactions WHERE event = 'visit' GROUP BY event", (error, results, fields) => {
//         if (error) throw error;
//         res.json(results);
//     });
// };

exports.getChartData1 = (req, res) => {
    const trackingId = req.query.trackingId;
    // Obtenir l'année courante pour concaténer avec le mois et le jour
    const currentYear = new Date().getFullYear();

    db.query(`
        SELECT 
            DAYNAME(timestamp) AS day_of_week, 
            DAY(timestamp) AS day_of_month,
            MONTHNAME(timestamp) AS month,
            CONCAT(DAY(timestamp), '-', MONTH(timestamp), '-', YEAR(timestamp)) AS full_date,
            COUNT(*) as count 
        FROM 
            interactions 
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
        GROUP BY 
            full_date
    `, [trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }
        res.json(results);
    });
};

exports.getChartData2 = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
        SELECT 
            YEARWEEK(timestamp) AS week_of_year,
            COUNT(*) as count 
        FROM 
            interactions 
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
        GROUP BY 
            week_of_year
        ORDER BY 
            week_of_year ASC
    `, [trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Calculer la différence de nombre de visiteurs entre chaque semaine et la semaine précédente
        const dataWithDifferences = results.map((item, index, array) => {
            if (index === 0) { // Pour la première semaine, on n'a pas de semaine précédente
                return { ...item, status: 'N/A' }; // Pas de comparaison disponible
            }

            const difference = item.count - array[index - 1].count;
            let status;
            if (difference > 0) {
                status = 'augmenté'; // La différence est positive
            } else if (difference < 0) {
                status = 'diminué'; // La différence est négative
            } else {
                status = 'stable'; // Pas de changement
            }
            return { ...item, difference, status };
        });

        res.json(dataWithDifferences);
    });
};

exports.getChartData3 = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
        SELECT 
            age,
            gender,
            location,
            language,
            COUNT(*) AS count 
        FROM 
            visitor_details 
        WHERE 
            tracking_id = ? 
        GROUP BY 
            age, gender, location, language
    `, [trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données démographiques.' });
        }
        res.json(results);
    });
};







exports.getChartData11 = (req, res) => {
    db.query("SELECT page,SUM(duration) AS total_duration FROM interactions WHERE event = 'visit' GROUP BY page; ", (error, results, fields) => {
        if (error) throw error;
        res.json(results);
    });
};

exports.getDonnées = (req, res) => {
    const trackingId = req.query.trackingId; // Récupérer le tracking_id à partir de la requête
    // Récupérer les données d'interaction correspondantes à partir du tracking_id
    db.query('SELECT * FROM interactions WHERE tracking_id = ?', [trackingId], (error, interactionResults) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données d\'interaction.' });
        }
        // Renvoyer les données d'interaction au format JSON
        res.json({ interactions: interactionResults });
    });
};


exports.getDonnées = (req, res) => {
    const trackingId = req.query.trackingId; // Récupérer le tracking_id à partir de la requête
    // Récupérer les données d'interaction correspondantes à partir du tracking_id
    db.query('SELECT * FROM interactions WHERE tracking_id = ?', [trackingId], (error, interactionResults) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données d\'interaction.' });
        }
        // Rendre le template Handlebars avec les données d'interaction
        const templateWithData = handlebars.compile(template)({ interactions: interactionResults });
        // Renvoyer la page HTML rendue
        res.send(templateWithData);
    });
};
