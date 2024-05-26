const Chart = require('chart.js');
const db = require('../config/database');
let loggedInClientId = null;
const handlebars = require('handlebars');
const axios = require('axios');
const langs = require('langs');
const useragent = require('useragent');
const userAgentParser = require('user-agent-parser');
const UAParser = require('ua-parser-js');
const NodeGeocoder = require('node-geocoder');
const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
});

const moment = require('moment-timezone');
const tzlookup = require('tz-lookup');


exports.getChartData1 = (req, res) => {
    const trackingId = req.query.trackingId;
    const selectedMonth = req.query.month || (new Date().getMonth() + 1); // Si le mois n'est pas fourni, utilisez le mois actuel
    const selectedYear = req.query.year || new Date().getFullYear(); // Si l'année n'est pas fournie, utilisez l'année actuelle

    db.query(`
        SELECT 
            DAYNAME(timestamp) AS day_of_week, 
            DAY(timestamp) AS day_of_month,
            MONTHNAME(timestamp) AS month,
            DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
            COUNT(*) AS count,
            COUNT(DISTINCT userAgent) as unique_userAgent,
            COUNT(DISTINCT page) as unique_pages_visited,
            SUM(duration) as duration_in_seconds,
            SUM(duration) as duration
        FROM 
            interactions 
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
            AND MONTH(timestamp) = ? 
            AND YEAR(timestamp) = ?
        GROUP BY 
        full_date
        `, [trackingId, selectedMonth, selectedYear], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }
        db.query(`
            SELECT 
                DAYNAME(timestamp) AS day_of_week, 
                DAY(timestamp) AS day_of_month,
                MONTHNAME(timestamp) AS month,
                DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
                COUNT(DISTINCT userAgent) as unique_userAgent1,
                COUNT(DISTINCT page) as unique_pages_visited1
            FROM 
                interactions 
            WHERE 
                event = 'visit' 
                AND tracking_id = ? 
                AND MONTH(timestamp) = ? 
                AND YEAR(timestamp) = ?
            GROUP BY 
                month
            `, [trackingId, selectedMonth, selectedYear], (error, results2, fields) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
            }
            // Traitez les résultats de la deuxième requête ici
            results.forEach(item => {
                item.duration_in_seconds = item.duration_in_seconds / 1000;
            });

            // Vous pouvez renvoyer les résultats dans un objet ou un tableau
            res.json({ results, results2 });
        });
    });
};

const ipInfoToken = 'e56638f86819ce';

exports.getGeolocation = (req, res) => {
    const trackingId = req.query.trackingId;
    db.query(`
        SELECT ip_address AS ipAddress, user_agent AS userAgent
        FROM interactions 
        WHERE tracking_id = ? 
        ORDER BY timestamp DESC
    `, [trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Aucune interaction trouvée pour le tracking ID spécifié.' });
        }

        // Array to store promises for each IP geolocation request
        const promises = [];

        results.forEach((result) => {
            const ipAddress = result.ipAddress;
            promises.push(
                axios.get(`https://ipinfo.io/${ipAddress}/json?token=${ipInfoToken}`)
                    .then((response) => {
                        // Attach geolocation data to each result
                        result.geolocation = response.data;
                    })
                    .catch((error) => {
                        console.error(`Erreur lors de la récupération de la localisation pour l'adresse IP ${ipAddress}:`, error);
                        // If there's an error, attach an error message to each result
                        result.geolocationError = 'Erreur lors de la récupération de la localisation pour cette adresse IP.';
                    })
            );
        });

        // Wait for all promises to resolve
        Promise.all(promises)
            .then(() => {
                res.status(200).json({ results });
            })
            .catch((error) => {
                console.error('Erreur lors de l\'exécution des requêtes de géolocalisation:', error);
                return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des localisations.' });
            });
    });
};

exports.getChartData4 = (req, res) => {
    const trackingId = req.query.trackingId;
    let selectedDayi = req.query.dayi || new Date().getDate();
    let selectedMonthi = req.query.monthi || (new Date().getMonth() + 1);
    let selectedYeari = req.query.yeari || new Date().getFullYear();

    db.query(`
    SELECT 
        DAYNAME(timestamp) AS day_of_week, 
        DAY(timestamp) AS day_of_month,
        MONTHNAME(timestamp) AS month,
        HOUR(timestamp) AS hour_of_day,
        DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
        COUNT(*) AS count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        SUM(duration) as duration_in_seconds,
        SUM(duration) as duration
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
        AND DAY(timestamp) = ? 
        AND MONTH(timestamp) = ? 
        AND YEAR(timestamp) = ?
    GROUP BY 
    hour_of_day
    `, [trackingId, selectedDayi, selectedMonthi, selectedYeari], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // Convertir les millisecondes en secondes
        });

        res.json(results);
    });
};

// exports.getChartData42 = (req, res) => {
//     const trackingId = req.query.trackingId;
//     let selectedDay2 = req.query.dayi2 || new Date().getDate();
//     let selectedMonth2 = req.query.monthi2 || (new Date().getMonth() + 1);
//     let selectedYear2 = req.query.yeari2 || new Date().getFullYear();

//     db.query(`
//     SELECT 
//         DAYNAME(timestamp) AS day_of_week, 
//         DAY(timestamp) AS day_of_month,
//         MONTHNAME(timestamp) AS month,
//         HOUR(timestamp) AS hour_of_day,
//         DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
//         COUNT(*) AS count,
//         COUNT(DISTINCT page) as unique_pages_visited,
//         COUNT(DISTINCT userAgent) as unique_userAgent,
//         SUM(duration) as duration_in_seconds,
//         COUNT(DISTINCT CASE 
//             WHEN userAgent NOT IN (
//                 SELECT DISTINCT userAgent 
//                 FROM interactions 
//                 WHERE DAY(timestamp) < ?
//                 AND MONTH(timestamp) = ?
//                 AND YEAR(timestamp) = ?
//                 AND tracking_id = ? 
//             ) 
//             AND DAY(timestamp) = ?
//             AND MONTH(timestamp) = ?
//             AND YEAR(timestamp) = ? THEN userAgent 
//             ELSE NULL 
//         END) AS new_userAgents_today,
//         SUM(duration) as duration
//     FROM 
//         interactions 
//     WHERE 
//         event = 'visit' 
//         AND tracking_id = ? 
//         AND DAY(timestamp) = ? 
//         AND MONTH(timestamp) = ? 
//         AND YEAR(timestamp) = ?
//     GROUP BY 
//         full_date
//     `, [selectedDay2, selectedMonth2, selectedYear2, trackingId, selectedDay2, selectedMonth2, selectedYear2, trackingId, selectedDay2, selectedMonth2, selectedYear2], (error, results, fields) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
//         }

//         // Convertir la durée en secondes
//         results.forEach(item => {
//             item.duration_in_seconds = item.duration_in_seconds / 1000; // Convertir les millisecondes en secondes
//         });

//         res.json(results);
//     });
// };

exports.getChartData42 = (req, res) => {
    const trackingId = req.query.trackingId;
    let selectedDay2 = req.query.dayi2 || new Date().getDate();
    let selectedMonth2 = req.query.monthi2 || (new Date().getMonth() + 1);
    let selectedYear2 = req.query.yeari2 || new Date().getFullYear();

    db.query(`
    SELECT 
        DAYNAME(timestamp) AS day_of_week, 
        DAY(timestamp) AS day_of_month,
        MONTHNAME(timestamp) AS month,
        HOUR(timestamp) AS hour_of_day,
        DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
        COUNT(*) AS count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        COUNT(DISTINCT userAgent) - COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
                SELECT 1
                FROM interactions AS prev
                WHERE prev.tracking_id = interactions.tracking_id
                AND prev.timestamp < interactions.timestamp
                AND prev.userAgent = interactions.userAgent
            ) THEN interactions.userAgent
            ELSE NULL 
        END) AS returning_userAgent,
        SUM(duration) as duration_in_seconds,
        
        COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
                SELECT 1
                FROM interactions AS prev
                WHERE prev.tracking_id = interactions.tracking_id
                AND prev.timestamp < interactions.timestamp
                AND prev.userAgent = interactions.userAgent
            ) THEN interactions.userAgent
            ELSE NULL 
        END) AS new_userAgents_today,
        
        SUM(duration) as duration
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
        AND DAY(timestamp) = ? 
        AND MONTH(timestamp) = ? 
        AND YEAR(timestamp) = ?
    GROUP BY 
        full_date
    `, [trackingId, selectedDay2, selectedMonth2, selectedYear2], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // Convertir les millisecondes en secondes
        });

        res.json(results);
    });
};

exports.getChartData42p = (req, res) => {
    const trackingId = req.query.trackingId;
    let selectedDay2p = req.query.dayi2p || new Date().getDate();
    let selectedMonth2p = req.query.monthi2p || (new Date().getMonth() + 1);
    let selectedYear2p = req.query.yeari2p || new Date().getFullYear();

    db.query(`
    SELECT 
        DAYNAME(timestamp) AS day_of_week, 
        DAY(timestamp) AS day_of_month,
        MONTHNAME(timestamp) AS month,
        HOUR(timestamp) AS hour_of_day,
        DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
        COUNT(*) AS count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        SUM(duration) as duration_in_seconds,
        
        COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
                SELECT 1
                FROM interactions AS prev
                WHERE prev.tracking_id = interactions.tracking_id
                AND prev.timestamp < interactions.timestamp
                AND prev.page = interactions.page
            ) THEN interactions.page
            ELSE NULL 
        END) AS new_pages_today,
        COUNT(DISTINCT page) - COUNT(DISTINCT CASE 
            WHEN NOT EXISTS (
                SELECT 1
                FROM interactions AS prev
                WHERE prev.tracking_id = interactions.tracking_id
                AND prev.timestamp < interactions.timestamp
                AND prev.page = interactions.page
            ) THEN interactions.page
            ELSE NULL 
        END) AS returning_pages,
        
        SUM(duration) as duration
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
        AND DAY(timestamp) = ? 
        AND MONTH(timestamp) = ? 
        AND YEAR(timestamp) = ?
    GROUP BY 
        full_date
    `, [trackingId, selectedDay2p, selectedMonth2p, selectedYear2p], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // Convertir les millisecondes en secondes
        });

        res.json(results);
    });
};

exports.getChartData42s = (req, res) => {
    // Récupérer la date actuelle
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à 0, donc ajoutez 1
    const currentYear = currentDate.getFullYear();

    // Générer les jours du mois actuel
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate(); // Nombre de jours dans le mois actuel

    // Créer un tableau pour stocker les boutons du calendrier
    const calendarDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
        // Ajouter une classe spéciale pour mettre en surbrillance le jour actuel
        const className = (i === currentDay) ? 'date current-day' : 'date';
        calendarDays.push(`<button class="${className}">${i}</button>`);
    }

    // Envoyer le calendrier dans la réponse JSON
    res.json({ calendarDays });
};

exports.getChartDatanew = (req, res) => {
    const trackingId = req.query.trackingId;
    const selectedMonth = req.query.month || (new Date().getMonth() + 1); // Si le mois n'est pas fourni, utilisez le mois actuel
    const selectedYear = req.query.year || new Date().getFullYear();

    db.query(`
    SELECT 
    MONTHNAME(interactions.timestamp) AS month,
    COUNT(*) AS count,
    COUNT(DISTINCT interactions.userAgent) AS unique_userAgent,
    COUNT(DISTINCT interactions.page) AS unique_pages_visited,
    SUM(interactions.duration) AS duration_in_seconds,
    COUNT(DISTINCT interactions.userAgent) - COUNT(DISTINCT CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM interactions AS prev
            WHERE prev.userAgent = interactions.userAgent
            AND MONTH(prev.timestamp) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
            AND YEAR(prev.timestamp) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) 
            AND prev.tracking_id = interactions.tracking_id 
            AND prev.event = 'visit'
            AND prev.timestamp < interactions.timestamp
        ) THEN interactions.userAgent
        ELSE NULL 
    END) AS returning_userAgent,
    COUNT(DISTINCT CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM interactions AS prev
            WHERE prev.userAgent = interactions.userAgent
            AND MONTH(prev.timestamp) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
            AND YEAR(prev.timestamp) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) 
            AND prev.tracking_id = interactions.tracking_id 
            AND prev.event = 'visit'
            AND prev.timestamp < interactions.timestamp
        ) THEN interactions.userAgent
        ELSE NULL 
    END) AS new_userAgents_today
FROM interactions
WHERE interactions.userAgent IS NOT NULL
AND MONTH(interactions.timestamp) = ?
AND YEAR(interactions.timestamp) = ?
AND interactions.tracking_id = ?
AND interactions.event = 'visit'
GROUP BY MONTH(interactions.timestamp);

    `, [selectedMonth, selectedYear, trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }
        db.query(`
            SELECT 
                DAYNAME(timestamp) AS day_of_week, 
                DAY(timestamp) AS day_of_month,
                MONTHNAME(timestamp) AS month,
                DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
                COUNT(DISTINCT userAgent) AS unique_userAgent1,
                COUNT(DISTINCT page) AS unique_pages_visited1
            FROM 
                interactions 
            WHERE 
                event = 'visit' 
                AND tracking_id = ? 
                AND MONTH(timestamp) = ? 
                AND YEAR(timestamp) = ?
            GROUP BY 
                month
            `, [trackingId, selectedMonth, selectedYear], (error, results2, fields) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
            }
            // Traitez les résultats de la deuxième requête ici
            results.forEach(item => {
                item.duration_in_seconds = item.duration_in_seconds / 1000;
            });

            // Vous pouvez renvoyer les résultats dans un objet ou un tableau
            res.json({ results, results2 });
        });
    });
};

exports.getChartDatanewp = (req, res) => {
    const trackingId = req.query.trackingId;
    const selectedMonthp = req.query.monthp || (new Date().getMonth() + 1); // Si le mois n'est pas fourni, utilisez le mois actuel
    const selectedYearp = req.query.yearp || new Date().getFullYear();

    db.query(`
    SELECT 
    MONTHNAME(interactions.timestamp) AS month,
    COUNT(*) AS count,
    COUNT(DISTINCT interactions.userAgent) AS unique_userAgent,
    COUNT(DISTINCT interactions.page) AS unique_pages_visited,
    SUM(interactions.duration) AS duration_in_seconds,
    COUNT(DISTINCT interactions.page) - COUNT(DISTINCT CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM interactions AS prev
            WHERE prev.page = interactions.page
            AND MONTH(prev.timestamp) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
            AND YEAR(prev.timestamp) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) 
            AND prev.tracking_id = interactions.tracking_id 
            AND prev.event = 'visit'
            AND prev.timestamp < interactions.timestamp
        ) THEN interactions.page
        ELSE NULL 
    END) AS returning_pages,
    COUNT(DISTINCT CASE 
        WHEN NOT EXISTS (
            SELECT 1
            FROM interactions AS prev
            WHERE prev.page = interactions.page
            AND MONTH(prev.timestamp) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
            AND YEAR(prev.timestamp) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH) 
            AND prev.tracking_id = interactions.tracking_id 
            AND prev.event = 'visit'
            AND prev.timestamp < interactions.timestamp
        ) THEN interactions.page
        ELSE NULL 
    END) AS new_page_today
FROM interactions
WHERE interactions.userAgent IS NOT NULL
AND MONTH(interactions.timestamp) = ?
AND YEAR(interactions.timestamp) = ?
AND interactions.tracking_id = ?
AND interactions.event = 'visit'
GROUP BY MONTH(interactions.timestamp);

    `, [selectedMonthp, selectedYearp, trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }
        db.query(`
            SELECT 
                DAYNAME(timestamp) AS day_of_week, 
                DAY(timestamp) AS day_of_month,
                MONTHNAME(timestamp) AS month,
                DATE_FORMAT(timestamp, '%d-%m-%Y') AS full_date,
                COUNT(DISTINCT userAgent) AS unique_userAgent1,
                COUNT(DISTINCT page) AS unique_pages_visited1
            FROM 
                interactions 
            WHERE 
                event = 'visit' 
                AND tracking_id = ? 
                AND MONTH(timestamp) = ? 
                AND YEAR(timestamp) = ?
            GROUP BY 
                month
            `, [trackingId, selectedMonthp, selectedYearp], (error, results2, fields) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
            }
            // Traitez les résultats de la deuxième requête ici
            results.forEach(item => {
                item.duration_in_seconds = item.duration_in_seconds / 1000;
            });

            // Vous pouvez renvoyer les résultats dans un objet ou un tableau
            res.json({ results, results2 });
        });
    });
};

exports.getChartData43 = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
    SELECT 
        COUNT(*) AS count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(CASE WHEN userType = 'new' THEN userType END) AS unique_userAgent,
        SUM(duration) as duration_in_seconds,
        SUM(duration) as duration
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
    `, [trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // Convertir les millisecondes en secondes
        });

        res.json(results);
    });
};

exports.getChartVisiteursData = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
    SELECT 
    main.userAgent AS unique_userAgent,
    COUNT(DISTINCT main.page) AS nombre_pages_visitees,
    (
        SELECT page
        FROM interactions 
        WHERE 
            tracking_id = main.tracking_id
            AND event = 'visit'
            AND userAgent = main.userAgent
        GROUP BY page
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ) AS most_visited_page,
    MAX(main.page) AS derniere_page_visitee,
    DATE_FORMAT(MAX(main.timestamp), '%d/%m/%Y %H:%i:%s') AS lastVisitTime,
    IFNULL(sub.clicks, 0) AS clicks
FROM interactions AS main
LEFT JOIN (
    SELECT 
        userAgent,
        COUNT(*) AS clicks
    FROM interactions 
    WHERE 
        tracking_id = ? 
        AND event = 'click'
        AND userAgent IS NOT NULL 
    GROUP BY userAgent
) AS sub ON main.userAgent = sub.userAgent
WHERE 
    main.tracking_id = ? 
    AND main.event = 'visit' 
    AND main.userAgent IS NOT NULL
GROUP BY main.userAgent;

    `, [trackingId, trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        db.query(`
            SELECT 
                MAX(page) AS derniere_page_visitee,
                CASE
                    WHEN SUM(
                        IF(event = 'leave', duration, 0) -
                        IF(event = 'visit', duration, 0)
                    ) < 0 THEN 'Session non terminée'
                    ELSE SEC_TO_TIME(
                        SUM(
                            IF(event = 'leave', duration, 0) -
                            IF(event = 'visit', duration, 0)
                        )
                    )
                END AS duree_derniere_visite
            FROM interactions
            WHERE 
                tracking_id = ? AND 
                event IN ('visit', 'leave') AND 
                userAgent IS NOT NULL
            GROUP BY userAgent;
        `, [trackingId], (error, results2, fields) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
            }
            db.query(`
                SELECT 
                    COUNT(*) AS clicks
                FROM interactions
                WHERE 
                    tracking_id = ? AND 
                    event = 'click' AND 
                    userAgent IS NOT NULL
                GROUP BY userAgent;
            `, [trackingId], (error, results3, fields) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
                }
                res.json({ results, results2, results3 });
            });
        });
    });
};

exports.getChartVisiteursinData = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
    SELECT 
        userAgent AS unique_userAgent,
        COUNT(DISTINCT page) AS nombre_pages_visitees,
        DATE_FORMAT(MAX(timestamp), '%d/%m/%Y %H:%i:%s') AS lastVisitTime,
        ip_address,
        userAgent AS browser,
        latitude,
        longitude
    FROM 
        interactions 
    WHERE 
        tracking_id = ? 
        AND event = 'visit' 
        AND userAgent IS NOT NULL
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
    GROUP BY userAgent;
    `, [trackingId, trackingId], async (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir les user-agents en noms de navigateurs
        results.forEach(item => {
            item.browser = parseUserAgent(item.browser);
        });

        // Ajout du pays à partir des coordonnées de longitude et de latitude en utilisant Nominatim
        for (let item of results) {
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${item.latitude}&lon=${item.longitude}&format=json`);
                if (response.data && response.data.address && response.data.address.country) {
                    item.country = response.data.address.country;
                } else {
                    item.country = "Inconnu";
                }
            } catch (error) {
                console.error(error);
                item.country = "Erreur";
            }
        }

        // Envoyer les données mises à jour avec les localisations au format JSON
        res.json(results);
    });
};

exports.getChartVisiteursin2Data = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
    SELECT 
        userAgent AS unique_userAgent,
        COUNT(DISTINCT page) AS nombre_pages_visitees,
        DATE_FORMAT(MAX(timestamp), '%d/%m/%Y %H:%i:%s') AS lastVisitTime,
        ip_address,
        userAgent AS browser,
        latitude,
        longitude
    FROM 
        interactions 
    WHERE 
        tracking_id = ? 
        AND event = 'visit' 
        AND userAgent IS NOT NULL
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
    GROUP BY latitude, longitude;
    `, [trackingId, trackingId], async (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir les user-agents en noms de navigateurs
        results.forEach(item => {
            item.browser = parseUserAgent(item.browser);
        });

        // Ajout du pays à partir des coordonnées de longitude et de latitude en utilisant Nominatim
        for (let item of results) {
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${item.latitude}&lon=${item.longitude}&format=json`);
                if (response.data && response.data.address && response.data.address.country) {
                    item.country = response.data.address.country;
                } else {
                    item.country = "Inconnu";
                }
            } catch (error) {
                console.error(error);
                item.country = "Erreur";
            }
        }

        // Envoyer les données mises à jour avec les localisations au format JSON
        res.json(results);
    });
};



exports.getChartVisiteursinData2 = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
    SELECT 
        userAgent AS unique_userAgent,
        COUNT(DISTINCT page) AS nombre_pages_visitees,
        DATE_FORMAT(MAX(timestamp), '%d/%m/%Y %H:%i:%s') AS lastVisitTime,
        latitude,
        longitude
    FROM 
        interactions 
    WHERE 
        tracking_id = ? 
        AND event = 'visit' 
        AND userAgent IS NOT NULL
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
    GROUP BY userAgent;
    `, [trackingId, trackingId], async (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Ajout du pays à partir des coordonnées de longitude et de latitude en utilisant Nominatim
        for (let item of results) {
            try {
                const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${item.latitude}&lon=${item.longitude}&format=json`);
                if (response.data && response.data.address && response.data.address.country) {
                    item.country = response.data.address.country;
                } else {
                    item.country = "Inconnu";
                }
            } catch (error) {
                console.error(error);
                item.country = "Erreur";
            }
        }

        // Envoyer les données mises à jour avec les localisations au format JSON
        res.json(results);
    });
};




exports.getChartPageData = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
        SELECT 
            page,
            COUNT(*) as total_visits,
            COUNT(DISTINCT userAgent) as unique_userAgent,
            (SELECT COUNT(*) FROM interactions WHERE event = 'click' AND page = main.page AND tracking_id = ?) as total_clicks
        FROM 
            interactions AS main
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
        GROUP BY 
            page
    `, [trackingId, trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000;
        });

        // Vous pouvez renvoyer les résultats dans un objet ou un tableau
        res.json(results);
    });
};




exports.getChartData12 = (req, res) => {
    const trackingId = req.query.trackingId;
    let selectedDay = req.query.day;
    let selectedMonth = req.query.month;
    let selectedYear = req.query.year;

    // Vérifier si les valeurs sélectionnées sont vides
    if (!selectedDay || !selectedMonth || !selectedYear) {
        // Utiliser la date actuelle si les valeurs sélectionnées sont vides
        const currentDate = new Date();
        selectedDay = currentDate.getDate();
        selectedMonth = currentDate.getMonth() + 1; // Les mois commencent à partir de 0, donc ajoutez 1 pour obtenir le mois actuel
        selectedYear = currentDate.getFullYear();
    }

    db.query(`
    SELECT 
        DAYNAME(timestamp) AS day_of_week, 
        DAY(timestamp) AS day_of_month,
        MONTHNAME(timestamp) AS month,
        HOUR(timestamp) AS hour_of_day,
        CONCAT(DAY(timestamp), '-', MONTH(timestamp), '-', YEAR(timestamp)) AS full_date,
        COUNT(*) as count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        COUNT(DISTINCT CASE 
            WHEN userAgent NOT IN (
                SELECT DISTINCT userAgent 
                FROM interactions AS i
                WHERE HOUR(i.timestamp) < HOUR(timestamp)
            ) THEN userAgent 
            ELSE NULL 
        END) AS new_userAgents_today,
        SUM(duration) as duration_in_seconds
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
        AND DAY(timestamp) = ?
        AND MONTH(timestamp) = ? 
        AND YEAR(timestamp) = ?
    GROUP BY 
    hour_of_day
    `, [trackingId, selectedDay, selectedMonth, selectedYear], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // La durée est en millisecondes, donc nous la divisons par 1000 pour obtenir les secondes
        });

        res.json(results);
    });

};

function convertSecondsToHMS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours}h ${minutes}m ${remainingSeconds}s`;
}
exports.getChartData2 = (req, res) => {
    const trackingId = req.query.trackingId;
    const currentYear = new Date().getFullYear();

    // Obtenir la date d'aujourd'hui et celle d'hier
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Convertir les dates en format MySQL (YYYY-MM-DD)
    const formattedToday = formatDate(today);
    const formattedYesterday = formatDate(yesterday);

    db.query(`
        SELECT 
            COUNT(*) as count 
        FROM 
            interactions 
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
            AND DATE(timestamp) = ? 
    `, [trackingId, formattedToday], (error, todayResult) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        db.query(`
            SELECT 
                COUNT(*) as count 
            FROM 
                interactions 
            WHERE 
                event = 'visit' 
                AND tracking_id = ? 
                AND DATE(timestamp) = ? 
        `, [trackingId, formattedYesterday], (error, yesterdayResult) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
            }

            const todayCount = todayResult[0].count;
            const yesterdayCount = yesterdayResult[0].count;

            let difference = todayCount - yesterdayCount;
            let trend;

            if (difference > 0) {
                trend = 'augmenté';
            } else if (difference < 0) {
                trend = 'diminué';
            } else {
                trend = 'stable';
            }

            res.json({ todayCount, trend });
        });
    });
};

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

exports.getChartData5 = (req, res) => {
    const trackingId = req.query.trackingId;
    db.query(`
        SELECT 
            page, 
            COUNT(*) AS visits 
        FROM 
            interactions 
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
        GROUP BY 
            page 
        ORDER BY 
            visits DESC
        LIMIT 10
    `, [trackingId], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Une erreur s'est produite lors de la récupération des données des pages les plus visitées." });
        }

        res.json(results);
    });
};
exports.getChartData7 = (req, res) => {
    const trackingId = req.query.trackingId;
    const currentDate = new Date();
    const fiveHoursAgo = new Date(currentDate.getTime() - (5 * 60 * 60 * 1000));
    const currentMonth = fiveHoursAgo.getMonth() + 1;
    const currentYear = fiveHoursAgo.getFullYear();
    const currentDay = fiveHoursAgo.getDate();
    const currentHour = fiveHoursAgo.getHours();

    db.query(`
    SELECT 
        HOUR(timestamp) AS hour,
        MINUTE(timestamp) AS minute,
        COUNT(*) as count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        SUM(duration) as duration_in_seconds
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
        AND DAY(timestamp) = ? 
        AND MONTH(timestamp) = ? 
        AND YEAR(timestamp) = ?
        AND HOUR(timestamp) >= ?
    GROUP BY 
        hour, minute
    `, [trackingId, currentDay, currentMonth, currentYear, currentHour], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // La durée est en millisecondes, donc nous la divisons par 1000 pour obtenir les secondes
        });

        res.json(results);
    });
};

exports.getChartData77 = (req, res) => {
    const trackingId = req.query.trackingId;

    db.query(`
    SELECT 
        DATE(timestamp) AS date,
        COUNT(*) as count,
        COUNT(DISTINCT page) as unique_pages_visited,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        SUM(duration) as duration_in_seconds
    FROM 
        interactions 
    WHERE 
        event = 'visit' 
        AND tracking_id = ? 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL 5 DAY)
    GROUP BY 
        DATE(timestamp)
    ORDER BY 
        DATE(timestamp) DESC
    `, [trackingId], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir la durée en secondes
        results.forEach(item => {
            item.duration_in_seconds = item.duration_in_seconds / 1000; // La durée est en millisecondes, donc nous la divisons par 1000 pour obtenir les secondes
        });

        // Obtenir la date actuelle et la date d'hier
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Trouver les données pour aujourd'hui et hier
        const todayData = results.find(item => item.date === todayStr) || { date: todayStr, count: 0, unique_pages_visited: 0, unique_userAgent: 0, duration_in_seconds: 0 };
        const yesterdayData = results.find(item => item.date === yesterdayStr) || { date: yesterdayStr, count: 0, unique_pages_visited: 0, unique_userAgent: 0, duration_in_seconds: 0 };

        // Ajouter les données pour aujourd'hui et hier aux résultats
        const responseData = {
            today: todayData,
            yesterday: yesterdayData,
            chartData: results
        };

        res.json(responseData);
    });
};




const parseUserAgent = (userAgentString) => {
    const parser = new UAParser();
    const result = parser.setUA(userAgentString).getResult();
    return result.browser.name;
};

exports.getChartData9 = (req, res) => {
    const trackingId = req.query.trackingId;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à partir de 0, donc ajoutez 1 pour obtenir le mois actuel
    const currentYear = currentDate.getFullYear();

    db.query(`
    SELECT
        DAYNAME(timestamp) AS day_of_week,
        DAY(timestamp) AS day_of_month,
        MONTHNAME(timestamp) AS month,
        CONCAT(DAY(timestamp), '-', MONTH(timestamp), '-', YEAR(timestamp)) AS full_date,
        COUNT(DISTINCT userAgent) as unique_userAgent,
        userAgent AS browser
    FROM
        interactions
    WHERE
        event = 'visit'
        AND tracking_id = ?
        AND MONTH(timestamp) = ?
        AND YEAR(timestamp) = ?
    GROUP BY
        full_date, browser
    `, [trackingId, currentMonth, currentYear], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        // Convertir les user-agents en noms de navigateurs
        results.forEach(item => {
            item.browser = parseUserAgent(item.browser);
        });

        res.json(results);
    });
};


exports.getChartData10 = (req, res) => {
    const trackingId = req.query.trackingId;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à partir de 0, donc ajoutez 1 pour obtenir le mois actuel
    const currentYear = currentDate.getFullYear();

    db.query(`
    SELECT
        language,
        COUNT(DISTINCT userAgent) AS user_count
    FROM
        interactions
    WHERE
        event = 'visit'
        AND tracking_id = ?
        AND MONTH(timestamp) = ?
        AND YEAR(timestamp) = ?
    GROUP BY
        language
    `, [trackingId, currentMonth, currentYear], (error, results, fields) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        res.json(results);
    });
};

exports.getChartData11 = (req, res) => {
};




