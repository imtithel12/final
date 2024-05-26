const bcrypt = require('bcryptjs');
const db = require('../config/database');
const util = require('util');

const fs = require('fs');
const path = require('path');

const mysql = require('mysql2/promise');

const nodemailer = require('nodemailer');

const axios = require('axios');

let loggedInClientId = null;
let trackingId = null;

exports.getInscrire = (req, res) => {
    return res.render('inscrire');
};

exports.postInscrire = async (req, res) => {
    const { nom, prenom, username, email, password, password_confirm } = req.body;

    // Vérifier si mail est utilisé dans la base de données
    db.query('SELECT * FROM clients WHERE email = ?', [email], async (error, result) => {
        if (error) {
            console.log(error);
            return res.render('inscrire', {
                message: 'Une erreur s\'est produite lors de la vérification de la disponibilité des e-mails!'
            });
        }

        if (result.length > 0) {
            return res.render('inscrire', {
                message: 'Cet e-mail est déjà utilisée!'
            });
        }

        // Vérifier si les mots de passe correspondent
        if (password !== password_confirm) {
            return res.render('inscrire', {
                message: 'Les mots de passe ne correspondent pas!'
            });
        }

        // Hasher le mot de passe avant de l'insérer dans la base de données
        const hashedPassword = await bcrypt.hash(password, 8);

        // Insérer les données dans la table 'clients'
        db.query('INSERT INTO clients (nom, prenom, username, email, password) VALUES (?, ?, ?, ?, ?)', [nom, prenom, username, email, hashedPassword], (err, result) => {
            if (err) {
                console.log(err);
                return res.render('inscrire', {
                    message: 'Une erreur s\'est produite lors de l\'enregistrement du client!'
                });
            } else {
                // Rediriger vers la page de connexion
                return res.redirect('/connecter');
            }
        });
    });
};
////////////////////////////////////////////////////////////////////////////////////////

exports.getConnecter = (req, res) => {
    return res.render('connecter');
};

exports.postConnecter = async (req, res) => {
    const { email, password } = req.body;

    // Recherche dans la table 'clients'
    db.query('SELECT * FROM clients WHERE email = ?', [email], async (error, clientResult) => {
        if (error) {
            console.error(error);
            return res.render('connecter', {
                message: 'Une erreur s\'est produite lors de la vérification de l\'email!'
            });
        }

        if (clientResult.length === 0) {
            // Si l'email n'est pas trouvé dans la table 'clients', vérifie dans la table 'administrateurs'
            db.query('SELECT * FROM administrateurs WHERE email = ?', [email], async (error, adminResult) => {
                if (error) {
                    console.error(error);
                    return res.render('connecter', {
                        message: 'Une erreur s\'est produite lors de la vérification de l\'email!'
                    });
                }

                if (adminResult.length === 0) {
                    // Si l'email ne correspond à aucun utilisateur
                    return res.render('connecter', {
                        message: 'Email incorrect!'
                    });
                }

                // Rediriger l'administrateur vers la page des clients
                return res.redirect('/clients');
            });
        } else {
            // Si l'email correspond à un client, vérifie le mot de passe
            const isPasswordMatch = await bcrypt.compare(password, clientResult[0].password);

            if (!isPasswordMatch) {
                return res.render('connecter', {
                    message: 'Mot de passe incorrect!'
                });
            }

            // Stocker l'ID du client connecté
            loggedInClientId = clientResult[0].id;

            // Rediriger le client vers la page pour ajouter une URL
            return res.redirect('/addurl');
        }
    });
};
/////////////////////////////////////////////////////////////////////////////////////////////////

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    // Recherche dans la table 'clients'
    db.query('SELECT * FROM clients WHERE email = ?', [email], async (error, clientResult) => {
        if (error) {
            console.error(error);
            return res.render('forgotPassword', {
                message: 'Une erreur s\'est produite lors de la vérification de l\'email'
            });
        }

        if (clientResult.length === 0) {
            // Si l'email n'est pas trouvé dans la table 'clients', vérifie dans la table 'administrateurs'
            db.query('SELECT * FROM administrateurs WHERE email = ?', [email], async (error, adminResult) => {
                if (error) {
                    console.error(error);
                    return res.render('forgotPassword', {
                        message: 'Une erreur s\'est produite lors de la vérification de l\'email'
                    });
                }

                if (adminResult.length === 0) {
                    // Si l'email ne correspond à aucun utilisateur
                    return res.render('forgotPassword', {
                        message: 'Aucun utilisateur trouvé avec cet email!'
                    });
                }

                // Si l'email correspond à un administrateur, vous pouvez implémenter une logique appropriée ici
                // Par exemple, envoyer un e-mail à l'administrateur pour réinitialiser son mot de passe
                return res.render('forgotPassword', {
                    message: 'Un e-mail de réinitialisation de mot de passe a été envoyé à votre adresse e-mail.'
                });
            });
        } else {
            // Si l'email correspond à un client, vous pouvez implémenter une logique appropriée ici
            // Par exemple, générer un jeton de réinitialisation de mot de passe et l'envoyer à l'utilisateur par e-mail

            // Configuration du transporteur Nodemailer pour envoyer des e-mails
            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                logger: true,
                debug: true,
                auth: {
                    user: 'imtithelbh7@gmail.com', // Adresse e-mail à partir de laquelle les e-mails seront envoyés
                    pass: 'Yarabyarab123@' // Mot de passe de l'adresse e-mail
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            // Options de l'e-mail à envoyer
            const mailOptions = {
                from: 'imtithelbh7@gmail.com', // Adresse e-mail à partir de laquelle l'e-mail sera envoyé
                to: email, // Adresse e-mail du destinataire (client)
                subject: 'Réinitialisation de mot de passe', // Objet de l'e-mail
                text: 'Voici le lien pour réinitialiser votre mot de passe : https://votre_site.com/reset-password?token=votre_token&email=' + email // Corps de l'e-mail avec le lien de réinitialisation du mot de passe
            };

            // Envoi de l'e-mail
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error(error);
                    return res.render('forgotPassword', {
                        message: 'Une erreur s\'est produite lors de l\'envoi de l\'e-mail de réinitialisation de mot de passe!'
                    });
                } else {
                    console.log('Email sent: ' + info.response);
                    return res.render('forgotPassword', {
                        message: 'Un e-mail de réinitialisation de mot de passe a été envoyé à votre adresse e-mail.'
                    });
                }
            });
        }
    });
};


///////////////////////////////////////////////////////////////////////////////////////////////

exports.getAllClients = (req, res) => {
    // Récupérer tous les clients à partir de la base de données
    db.getAllClients((err, clients) => {
        if (err) {
            // Gérer les erreurs de récupération des clients
            return res.status(500).send("Error retrieving clients");
        }
        // Rendre la vue avec les clients récupérés
        res.render('clients', { clients: clients });
    });
};
//////////////////////////////////////////////////////////////////////////////////////////////
exports.getUrls = (req, res) => {
    // Sélectionner toutes les URLs de la base de données
    db.query('SELECT * FROM urls', (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).render('error', {
                message: 'Une erreur s\'est produite lors de la récupération des URLs.'
            });
        }

        // Rendre une vue pour afficher les URLs récupérées
        res.render('urls', { urls: results });
    });
};
///////////////////////////////////////////////////////////////////////////////////////////////

exports.getProfile = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client et de la première lettre du nom d'utilisateur dans la base de données
    db.query('SELECT *, UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }

        // Sélectionner les URL du client connecté à partir de la base de données
        db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResults) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Afficher le profil du client avec les URLs associées
            res.render('profile', { client: results[0], urls: urlResults });
        });
    });
};
///////////////////////////////////////////////////////////////////////////////////////////////

exports.getUpdateProfile = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client et de la première lettre du nom d'utilisateur dans la base de données
    db.query('SELECT *, UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }

        // Sélectionner les URL du client connecté à partir de la base de données
        db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResults) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Afficher le profil du client avec les URLs associées
            res.render('updateprofile', { client: results[0], urls: urlResults });
        });
    });
};

exports.postUpdateProfile = (req, res) => {
    const { nom, prenom, username, email } = req.body;

    // Mettre à jour les détails du client dans la base de données
    db.query(
        'UPDATE clients SET nom = ?, prenom = ?, username = ?, email = ? WHERE id = ?',
        [nom, prenom, username, email, loggedInClientId],
        (err) => {
            if (err) {
                return res.status(500).send(err);
            }

            // Rediriger vers la page du profil après la mise à jour réussie
            res.redirect('/profile');
        }
    );
};
/////////////////////////////////////////////////////////////////////////////////////////////
exports.getUpdateProfilePassword = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client et de la première lettre du nom d'utilisateur dans la base de données
    db.query('SELECT *, UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }

        // Sélectionner les URL du client connecté à partir de la base de données
        db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResults) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Afficher le profil du client avec les URLs associées
            res.render('updateprofilepassword', { client: results[0], urls: urlResults });
        });
    });
};

exports.postUpdateProfilePassword = async (req, res) => {
    const { old_password, new_password, confirm_new_password } = req.body;

    // Recherche du mot de passe actuel du client
    db.query('SELECT password FROM clients WHERE id = ?', [loggedInClientId], async (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du mot de passe'
            });
        }

        const currentPassword = results[0].password;

        // Vérification de la correspondance entre l'ancien mot de passe fourni et le mot de passe actuel
        const isPasswordMatch = await bcrypt.compare(old_password, currentPassword);

        if (!isPasswordMatch) {
            return res.render('updateprofilepassword', {
                message: 'L\'ancien mot de passe est incorrect!'
            });
        }

        // Vérification si le nouveau mot de passe correspond à la confirmation
        if (new_password !== confirm_new_password) {
            return res.render('updateprofilepassword', {
                message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas!'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedNewPassword = await bcrypt.hash(new_password, 8);

        // Mettre à jour le mot de passe dans la base de données
        db.query(
            'UPDATE clients SET password = ? WHERE id = ?',
            [hashedNewPassword, loggedInClientId],
            (err) => {
                if (err) {
                    return res.status(500).render('error', {
                        message: 'Une erreur s\'est produite lors de la mise à jour du mot de passe'
                    });
                }

                // Redirection vers la page de profil après la mise à jour réussie
                res.redirect('/profile');
            }
        );
    });
};

exports.getUpdateProfileUrls = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client et de la première lettre du nom d'utilisateur dans la base de données
    db.query('SELECT *, UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }

        // Sélectionner les URL du client connecté à partir de la base de données
        db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResults) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Afficher le profil du client avec les URLs associées
            res.render('updateprofileurls', { client: results[0], urls: urlResults });
        });
    });
};

exports.getAddUrl = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client dans la base de données
    db.query('SELECT UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }

        // Sélectionner les URL du client connecté à partir de la base de données
        db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResults) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Afficher le profil du client avec les URLs associées
            res.render('add_url', { client: results[0], urls: urlResults });
        });
    });
};

exports.getScript = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client dans la base de données
    db.query('SELECT UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }

        // Sélectionner le dernier tracking_id ajouté à partir de la table des URL
        db.query('SELECT tracking_id FROM urls ORDER BY id DESC LIMIT 1', (error, urlResults) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération du tracking_id'
                });
            }

            // Vérifier si un tracking_id a été trouvé
            if (urlResults.length === 0) {
                return res.render('error', {
                    message: 'Aucun tracking_id trouvé'
                });
            }

            // Afficher le tracking_id récupéré
            const trackingId = urlResults[0].tracking_id;
            res.render('script', { client: results[0], trackingId: trackingId });
        });
    });
};

function generateUniqueId() {
    // Code pour générer un identifiant unique, par exemple avec un module Node.js comme 'uuid'
    const uuid = require('uuid');
    return uuid.v4(); // Génère un identifiant UUID (Universally Unique Identifier) aléatoire
}
exports.postAddUrl = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }
    const { titre, url } = req.body;
    const clientId = loggedInClientId; // Utilisez l'ID du client connecté

    // Vérifiez si l'URL est présente
    if (!url) {
        return res.status(400).render('add_url', {
            message: 'Veuillez fournir une URL.'
        });
    }

    // Vérifiez si l'URL existe déjà dans la base de données
    db.query('SELECT * FROM urls WHERE url = ?', [url], (selectError, selectResults) => {
        if (selectError) {
            console.error(selectError);
            return res.status(500).render('add_url', {
                message: 'Une erreur s\'est produite lors de la vérification de l\'existence de l\'URL.'
            });
        }

        // Si l'URL existe déjà, redirigez avec un message d'erreur
        if (selectResults.length > 0) {
            return res.status(400).render('add_url', {
                message: 'Cette URL existe déjà!'
            });
        }

        // Générer un identifiant de suivi unique pour cette URL
        const trackingId = generateUniqueId();

        // Générer le code de suivi unique pour cette URL
        const urlScript = `<script src="userActivityTracker.js?trackingId=${trackingId}"></script>`;

        // Insérer l'URL dans la base de données avec le code de suivi
        db.query('INSERT INTO urls (client_id, titre, url, url_script, tracking_id) VALUES (?, ?, ?, ?, ?)', [clientId, titre, url, urlScript, trackingId], (insertError, insertResult) => {
            if (insertError) {
                console.error(insertError);
                return res.status(500).render('add_url', {
                    message: 'Une erreur s\'est produite lors de l\'ajout de l\'URL.'
                });
            }

            // Redirigez vers la page addurl
            res.redirect('/script');
        });
    });
};

exports.deleteUrl = (req, res) => {
    const urlId = req.params.id; // Récupérer l'ID de l'URL à supprimer depuis les paramètres de la requête

    // Vérifier si l'URL appartient au client connecté
    db.query('SELECT * FROM urls WHERE id = ? AND client_id = ?', [urlId, loggedInClientId], (error, urlResult) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Une erreur s'est produite lors de la suppression de l'URL." });
        }

        // Vérifier si l'URL existe et appartient au client connecté
        if (urlResult.length === 0) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette URL." });
        }

        // Exécuter la requête pour supprimer l'URL de la base de données
        db.query('DELETE FROM urls WHERE id = ?', [urlId], (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Une erreur s'est produite lors de la suppression de l'URL." });
            }


            const message = "L'URL a été supprimée avec succès.";
            res.redirect('/updateProfileUrls?message=' + encodeURIComponent(message)); // Vous pouvez rediriger vers la page du profil ou toute autre page souhaitée
        });
    });
};
exports.deleteUrlp = (req, res) => {
    const urlId = req.params.id; // Récupérer l'ID de l'URL à supprimer depuis les paramètres de la requête

    // Vérifier si l'URL appartient au client connecté
    db.query('SELECT * FROM urls WHERE id = ? AND client_id = ?', [urlId, loggedInClientId], (error, urlResult) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: "Une erreur s'est produite lors de la suppression de l'URL." });
        }

        // Vérifier si l'URL existe et appartient au client connecté
        if (urlResult.length === 0) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cette URL." });
        }

        // Exécuter la requête pour supprimer l'URL de la base de données
        db.query('DELETE FROM urls WHERE id = ?', [urlId], (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ message: "Une erreur s'est produite lors de la suppression de l'URL." });
            }


            const message = "L'URL a été supprimée avec succès.";
            res.redirect('/projets?message=' + encodeURIComponent(message)); // Vous pouvez rediriger vers la page du profil ou toute autre page souhaitée
        });
    });
};


///////////////////////////////////////////////////////////////////////////////////////////////

exports.getProjets = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client dans la base de données
    db.query('SELECT UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }
        const today = new Date().toISOString().split('T')[0];
        db.query('SELECT * FROM urls WHERE client_id = ? AND DATE(created_at) = ?', [loggedInClientId, today], (error, urlResultsToday) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Sélectionner tous les URLs du client connecté à partir de la base de données
            db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResultsAll) => {
                if (error) {
                    console.error(error);
                    return res.status(500).render('error', {
                        message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                    });
                }

                // Afficher le profil du client avec les URLs associées
                res.render('projets', { client: results[0], urls: urlResultsAll, urlsToday: urlResultsToday });
            });
        });
    });
};

// exports.getChart = (req, res) => {
//     const trackingId = req.query.trackingId;
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à partir de 0, donc ajoutez 1 pour obtenir le mois actuel
//     const currentYear = currentDate.getFullYear();

//     db.query(`
//         SELECT 
//             SUM(duration) AS total_duration,
//             COUNT(DISTINCT page) AS total_unique_pages_visited,
//             COUNT(DISTINCT userAgent) AS total_unique_userAgent
//         FROM 
//             interactions 
//         WHERE 
//             event = 'visit' 
//             AND tracking_id = ? 
//             AND MONTH(timestamp) = ? 
//             AND YEAR(timestamp) = ?
//     `, [trackingId, currentMonth, currentYear], (error, chartResults) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
//         }

//         const readableChartResults = chartResults.map(item => ({
//             total_duration: convertSecondsToHMS(item.total_duration),
//             total_unique_pages_visited: item.total_unique_pages_visited,
//             total_unique_userAgent: item.total_unique_userAgent
//         }));

//         if (!loggedInClientId) {
//             return res.redirect('/connecter');
//         }

//         // Recherche du profil du client dans la base de données
//         db.query('SELECT * FROM clients WHERE id = ?', [loggedInClientId], (error, clientResults) => {
//             if (error) {
//                 console.error(error);
//                 return res.render('error', { message: 'Une erreur s\'est produite lors de la récupération du profil du client' });
//             }

//             if (clientResults.length === 0) {
//                 return res.render('error', { message: 'Profil du client non trouvé' });
//             }

//             // Sélectionner les URL du client connecté à partir de la base de données
//             db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResults) => {
//                 if (error) {
//                     console.error(error);
//                     return res.status(500).render('error', { message: 'Une erreur s\'est produite lors de la récupération des URLs du client.' });
//                 }

//                 // Afficher le profil du client avec les URLs associées et les données de chart
//                 res.render('chartt', {
//                     client: clientResults[0],
//                     urls: urlResults,
//                     chartData: readableChartResults
//                 });
//             });
//         });
//     });
// };


// exports.getChart = (req, res) => {
//     const trackingId = req.query.trackingId;
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1; // Les mois commencent à partir de 0, donc ajoutez 1 pour obtenir le mois actuel
//     const currentYear = currentDate.getFullYear();

//     db.query(`
//         SELECT DISTINCT userAgent
//         FROM interactions 
//         WHERE 
//             event = 'visit' 
//             AND tracking_id = ? 
//             AND MONTH(timestamp) = ? 
//             AND YEAR(timestamp) = ?
//     `, [trackingId, currentMonth, currentYear], (error, userAgentResults) => {
//         if (error) {
//             console.error(error);
//             return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de l\'agent utilisateur.' });
//         }

//         const userAgentList = userAgentResults.map(item => item.userAgent);
//         res.render('chartt', { userAgentList: userAgentList });
//     });
// };

// {{#each userAgentList}}
//                                                 <li>{{this}}</li>
//                                                 {{/each}}

exports.getChart = (req, res) => {
    const trackingId = req.query.trackingId;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Définition des mois
    const months = [
        { value: 1, name: "Janvier", selected: currentMonth === 1 },
        { value: 2, name: "Février", selected: currentMonth === 2 },
        { value: 3, name: "Mars", selected: currentMonth === 3 },
        { value: 4, name: "Avril", selected: currentMonth === 4 },
        { value: 5, name: "Mai", selected: currentMonth === 5 },
        { value: 6, name: "Juin", selected: currentMonth === 6 },
        { value: 7, name: "Juillet", selected: currentMonth === 7 },
        { value: 8, name: "Août", selected: currentMonth === 8 },
        { value: 9, name: "Septembre", selected: currentMonth === 9 },
        { value: 10, name: "Octobre", selected: currentMonth === 10 },
        { value: 11, name: "Novembre", selected: currentMonth === 11 },
        { value: 12, name: "Décembre", selected: currentMonth === 12 }
    ];

    db.query(`
        SELECT 
            DAYNAME(timestamp) AS day_of_week, 
            DAY(timestamp) AS day_of_month,
            MONTHNAME(timestamp) AS month,
            HOUR(timestamp) AS hour_of_day,
            CONCAT(DAY(timestamp), '-', MONTH(timestamp), '-', YEAR(timestamp)) AS full_date,
            SUM(duration) AS total_duration,
            COUNT(DISTINCT page) AS total_unique_pages_visited,
            COUNT(DISTINCT userAgent) AS total_unique_userAgent
        FROM 
            interactions 
        WHERE 
            event = 'visit' 
            AND tracking_id = ? 
            AND MONTH(timestamp) = ? 
            AND YEAR(timestamp) = ?
    `, [trackingId, currentMonth, currentYear], (error, chartResults) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ message: 'Une erreur s\'est produite lors de la récupération des données de chart.' });
        }

        const readableChartResults = chartResults.map(item => ({
            total_duration: convertSecondsToHMS(item.total_duration),
            total_unique_pages_visited: item.total_unique_pages_visited,
            total_unique_userAgent: item.total_unique_userAgent,
            full_date: item.full_date // Ajoutez full_date à l'objet de données
        }));

        if (!loggedInClientId) {
            return res.redirect('/connecter');
        }

        // Recherche du profil du client dans la base de données
        db.query('SELECT UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, clientResults) => {
            if (error) {
                console.error(error);
                return res.render('error', { message: 'Une erreur s\'est produite lors de la récupération du profil du client' });
            }

            if (clientResults.length === 0) {
                return res.render('error', { message: 'Profil du client non trouvé' });
            }

            // Sélectionner les URL du client connecté à partir de la base de données
            db.query('SELECT * FROM urls WHERE client_id = ? AND tracking_id = ?', [loggedInClientId, trackingId], (error, urlResults) => {
                if (error) {
                    console.error(error);
                    return res.status(500).render('error', { message: 'Une erreur s\'est produite lors de la récupération des URLs du client.' });
                }

                // Afficher le profil du client avec les URLs associées et les données de chart
                res.render('chartt', {
                    client: clientResults[0],
                    urls: urlResults,
                    chartData: readableChartResults,
                    months: months // Passer les mois au modèle
                });
            });
        });
    });
};




function convertSecondsToHMS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
}

exports.getExporter = (req, res) => {
};
function formatDuration(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours}:${minutes}:${seconds}`;
}

// exports.getRapportData = (req, res) => {
//     const trackingId = req.query.trackingId;
//     // Récupérer la date d'aujourd'hui
//     const today = new Date();
//     const day = today.getDate();
//     const month = today.toLocaleString('default', { month: 'long' });
//     const year = today.getFullYear();
//     const formattedDate = `${day} ${month} ${year}`;

//     const yesterday = new Date(today);
//     yesterday.setDate(today.getDate() - 1);
//     const dayYesterday = yesterday.getDate();
//     const monthYesterday = yesterday.toLocaleString('default', { month: 'long' });
//     const yearYesterday = yesterday.getFullYear();
//     const formattedDateYesterday = `${dayYesterday} ${monthYesterday} ${yearYesterday}`;

//     const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
//     const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

//     const startOfThisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
//     const endOfThisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
//     const startOfWeekFormatted = `${startOfThisWeek.getDate()} ${startOfThisWeek.toLocaleString('default', { month: 'long' })} ${startOfThisWeek.getFullYear()}`;
//     const endOfWeekFormatted = `${endOfThisWeek.getDate()} ${endOfThisWeek.toLocaleString('default', { month: 'long' })} ${endOfThisWeek.getFullYear()}`;

//     const startOfLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7);
//     const endOfLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
//     const startOfWeekFormattedYesterday = `${startOfLastWeek.getDate()} ${startOfLastWeek.toLocaleString('default', { month: 'long' })} ${startOfLastWeek.getFullYear()}`;
//     const endOfWeekFormattedYesterday = `${endOfLastWeek.getDate()} ${endOfLastWeek.toLocaleString('default', { month: 'long' })} ${endOfLastWeek.getFullYear()}`;

//     const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//     const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
//     const startOfMonthFormatted = `${startOfThisMonth.getDate()} ${startOfThisMonth.toLocaleString('default', { month: 'long' })} ${startOfThisMonth.getFullYear()}`;
//     const endOfMonthFormatted = `${endOfThisMonth.getDate()} ${endOfThisMonth.toLocaleString('default', { month: 'long' })} ${endOfThisMonth.getFullYear()}`;

//     const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
//     const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
//     const startOfMonthFormattedYesterday = `${startOfLastMonth.getDate()} ${startOfLastMonth.toLocaleString('default', { month: 'long' })} ${startOfLastMonth.getFullYear()}`;
//     const endOfMonthFormattedYesterday = `${endOfLastMonth.getDate()} ${endOfLastMonth.toLocaleString('default', { month: 'long' })} ${endOfLastMonth.getFullYear()}`;

//     const startOfThisYear = new Date(today.getFullYear(), 0, 1);
//     const endOfThisYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
//     const startOfYearFormatted = `${startOfThisYear.getDate()} ${startOfThisYear.toLocaleString('default', { month: 'long' })} ${startOfThisYear.getFullYear()}`;
//     const endOfYearFormatted = `${endOfThisYear.getDate()} ${endOfThisYear.toLocaleString('default', { month: 'long' })} ${endOfThisYear.getFullYear()}`;

//     const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
//     const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
//     const startOfYearFormattedYesterday = `${startOfLastYear.getDate()} ${startOfLastYear.toLocaleString('default', { month: 'long' })} ${startOfLastYear.getFullYear()}`;
//     const endOfYearFormattedYesterday = `${endOfLastYear.getDate()} ${endOfLastYear.toLocaleString('default', { month: 'long' })} ${endOfLastYear.getFullYear()}`;

//     if (!loggedInClientId) {
//         return res.redirect('/connecter');
//     }

//     // Recherche du profil du client dans la base de données
//     db.query('SELECT UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, clientResults) => {
//         if (error) {
//             console.error(error);
//             return res.render('error', { message: 'Une erreur s\'est produite lors de la récupération du profil du client' });
//         }

//         if (clientResults.length === 0) {
//             return res.render('error', { message: 'Profil du client non trouvé' });
//         }

//         // Fonction pour éviter la répétition de la récupération des données et rendre le code plus lisible
//         const fetchData = (sqlQuery, queryParams, callback) => {
//             db.query(sqlQuery, queryParams, (error, results) => {
//                 if (error) {
//                     console.error(error);
//                     return res.status(500).render('error', { message: 'Une erreur s\'est produite lors de la récupération des données pour le rapport.' });
//                 }
//                 callback(results);
//             });
//         };

//         // Fonction pour formater la durée au format heures:minutes:secondes
//         const formatDuration = (durationInSeconds) => {
//             const hours = Math.floor(durationInSeconds / 3600);
//             const minutes = Math.floor((durationInSeconds % 3600) / 60);
//             const seconds = durationInSeconds % 60;
//             return `${hours}:${minutes}:${seconds}`;
//         };

//         fetchData(`
//             SELECT
//                 COUNT(DISTINCT page) AS nombre_pages_visitees_semaine
//             FROM
//                 interactions
//             WHERE
//                 event = 'visit'
//                 AND tracking_id = ?
//                 AND timestamp >= ?
//                 AND timestamp < ?
//         `, [trackingId, startOfThisWeek, endOfThisWeek], (pageWeekResults) => {
//             const nombrePagesVisiteesSemaine = pageWeekResults[0].nombre_pages_visitees_semaine;

//             fetchData(`
//                 SELECT
//                     COUNT(*) AS nombre_visiteurs_semaine
//                 FROM
//                     interactions
//                 WHERE
//                     event = 'visit'
//                     AND tracking_id = ?
//                     AND timestamp >= ?
//                     AND timestamp < ?
//             `, [trackingId, startOfThisWeek, endOfThisWeek], (visitorWeekResults) => {
//                 const nombreVisiteursSemaine = visitorWeekResults[0].nombre_visiteurs_semaine;

//                 fetchData(`
//                     SELECT
//                         COUNT(DISTINCT page) AS nombre_pages_visitees_aujourdhui
//                     FROM
//                         interactions
//                     WHERE
//                         event = 'visit'
//                         AND tracking_id = ?
//                         AND timestamp >= ?
//                         AND timestamp < ?
//                 `, [trackingId, startOfToday, endOfToday], (pageTodayResults) => {
//                     const nombrePagesVisiteesAujourdhui = pageTodayResults[0].nombre_pages_visitees_aujourdhui;

//                     fetchData(`
//                         SELECT
//                             COUNT(*) AS nombre_visiteurs_aujourdhui
//                         FROM
//                             interactions
//                         WHERE
//                             event = 'visit'
//                             AND tracking_id = ?
//                             AND timestamp >= ?
//                             AND timestamp < ?
//                     `, [trackingId, startOfToday, endOfToday], (visitorTodayResults) => {
//                         const nombreVisiteursAujourdhui = visitorTodayResults[0].nombre_visiteurs_aujourdhui;

//                         fetchData(`
//                             SELECT
//                                 COUNT(DISTINCT page) AS nombre_pages_visitees_ce_mois
//                             FROM
//                                 interactions
//                             WHERE
//                                 event = 'visit'
//                                 AND tracking_id = ?
//                                 AND timestamp >= ?
//                                 AND timestamp < ?
//                         `, [trackingId, startOfThisMonth, endOfThisMonth], (pageMonthResults) => {
//                             const nombrePagesVisiteesCeMois = pageMonthResults[0].nombre_pages_visitees_ce_mois;

//                             fetchData(`
//                                 SELECT
//                                     COUNT(*) AS nombre_visiteurs_ce_mois
//                                 FROM
//                                     interactions
//                                 WHERE
//                                     event = 'visit'
//                                     AND tracking_id = ?
//                                     AND timestamp >= ?
//                                     AND timestamp < ?
//                             `, [trackingId, startOfThisMonth, endOfThisMonth], (visitorMonthResults) => {
//                                 const nombreVisiteursCeMois = visitorMonthResults[0].nombre_visiteurs_ce_mois;

//                                 fetchData(`
//                                     SELECT
//                                         SUM(duration) AS total_duree_aujourdhui
//                                     FROM
//                                         interactions
//                                     WHERE
//                                         event = 'visit'
//                                         AND tracking_id = ?
//                                         AND timestamp >= ?
//                                         AND timestamp < ?
//                                 `, [trackingId, startOfToday, endOfToday], (durationTodayResults) => {
//                                     const totalDurationAujourdhui = formatDuration(durationTodayResults[0].total_duree_aujourdhui);

//                                     fetchData(`
//                                         SELECT
//                                             SUM(duration) AS total_duree_semaine
//                                         FROM
//                                             interactions
//                                         WHERE
//                                             event = 'visit'
//                                             AND tracking_id = ?
//                                             AND timestamp >= ?
//                                             AND timestamp < ?
//                                     `, [trackingId, startOfThisWeek, endOfThisWeek], (durationWeekResults) => {
//                                         const totalDurationSemaine = formatDuration(durationWeekResults[0].total_duree_semaine);

//                                         fetchData(`
//                                             SELECT
//                                                 SUM(duration) AS total_duree_annee
//                                             FROM
//                                                 interactions
//                                             WHERE
//                                                 event = 'visit'
//                                                 AND tracking_id = ?
//                                                 AND timestamp >= ?
//                                                 AND timestamp < ?
//                                         `, [trackingId, startOfThisYear, endOfThisYear], (durationYearResults) => {
//                                             const totalDurationAnnee = formatDuration(durationYearResults[0].total_duree_annee);

//                                             fetchData(`
//                                                 SELECT
//                                                     SUM(duration) AS total_duree_ce_mois
//                                                 FROM
//                                                     interactions
//                                                 WHERE
//                                                     event = 'visit'
//                                                     AND tracking_id = ?
//                                                     AND timestamp >= ?
//                                                     AND timestamp < ?
//                                             `, [trackingId, startOfThisMonth, endOfThisMonth], (durationMonthResults) => {
//                                                 const totalDurationCeMois = formatDuration(durationMonthResults[0].total_duree_ce_mois);

//                                                 fetchData(`
//                                                     SELECT
//                                                         COUNT(DISTINCT userAgent) AS nombre_user_agents_aujourdhui
//                                                     FROM
//                                                         interactions
//                                                     WHERE
//                                                         tracking_id = ?
//                                                         AND timestamp >= ?
//                                                         AND timestamp < ?
//                                                 `, [trackingId, startOfToday, endOfToday], (userAgentTodayResults) => {
//                                                     const nombreUserAgentsAujourdhui = userAgentTodayResults[0].nombre_user_agents_aujourdhui;

//                                                     fetchData(`
//                                                         SELECT
//                                                             COUNT(DISTINCT userAgent) AS nombre_user_agents_semaine
//                                                         FROM
//                                                             interactions
//                                                         WHERE
//                                                             tracking_id = ?
//                                                             AND timestamp >= ?
//                                                             AND timestamp < ?
//                                                     `, [trackingId, startOfThisWeek, endOfThisWeek], (userAgentWeekResults) => {
//                                                         const nombreUserAgentsSemaine = userAgentWeekResults[0].nombre_user_agents_semaine;

//                                                         fetchData(`
//                                                             SELECT
//                                                                 COUNT(DISTINCT userAgent) AS nombre_user_agents_mois
//                                                             FROM
//                                                                 interactions
//                                                             WHERE
//                                                                 tracking_id = ?
//                                                                 AND timestamp >= ?
//                                                                 AND timestamp < ?
//                                                         `, [trackingId, startOfThisMonth, endOfThisMonth], (userAgentMonthResults) => {
//                                                             const nombreUserAgentsMois = userAgentMonthResults[0].nombre_user_agents_mois;

//                                                             fetchData(`
//                                                                 SELECT
//                                                                     COUNT(DISTINCT userAgent) AS nombre_user_agents_annee
//                                                                 FROM
//                                                                     interactions
//                                                                 WHERE
//                                                                     tracking_id = ?
//                                                                     AND timestamp >= ?
//                                                                     AND timestamp < ?
//                                                             `, [trackingId, startOfThisYear, endOfThisYear], (userAgentYearResults) => {
//                                                                 const nombreUserAgentsAnnee = userAgentYearResults[0].nombre_user_agents_annee;

//                                                                 fetchData(`
//                                                                     SELECT
//                                                                         COUNT(*) AS nombre_clicks_aujourdhui
//                                                                     FROM
//                                                                         interactions
//                                                                     WHERE
//                                                                         event = 'click'
//                                                                         AND tracking_id = ?
//                                                                         AND timestamp >= ?
//                                                                         AND timestamp < ?
//                                                                 `, [trackingId, startOfToday, endOfToday], (clickTodayResults) => {
//                                                                     const nombreClicksAujourdhui = clickTodayResults[0].nombre_clicks_aujourdhui;

//                                                                     fetchData(`
//                                                                         SELECT
//                                                                             COUNT(*) AS nombre_clicks_semaine
//                                                                         FROM
//                                                                             interactions
//                                                                         WHERE
//                                                                             event = 'click'
//                                                                             AND tracking_id = ?
//                                                                             AND timestamp >= ?
//                                                                             AND timestamp < ?
//                                                                     `, [trackingId, startOfThisWeek, endOfThisWeek], (clickWeekResults) => {
//                                                                         const nombreClicksSemaine = clickWeekResults[0].nombre_clicks_semaine;

//                                                                         fetchData(`
//                                                                             SELECT
//                                                                                 COUNT(*) AS nombre_clicks_ce_mois
//                                                                             FROM
//                                                                                 interactions
//                                                                             WHERE
//                                                                                 event = 'click'
//                                                                                 AND tracking_id = ?
//                                                                                 AND timestamp >= ?
//                                                                                 AND timestamp < ?
//                                                                         `, [trackingId, startOfThisMonth, endOfThisMonth], (clickMonthResults) => {
//                                                                             const nombreClicksCeMois = clickMonthResults[0].nombre_clicks_ce_mois;

//                                                                             fetchData(`
//                                                                                 SELECT
//                                                                                     COUNT(*) AS nombre_clicks_annee
//                                                                                 FROM
//                                                                                     interactions
//                                                                                 WHERE
//                                                                                     event = 'click'
//                                                                                     AND tracking_id = ?
//                                                                                     AND timestamp >= ?
//                                                                                     AND timestamp < ?
//                                                                             `, [trackingId, startOfThisYear, endOfThisYear], (clickYearResults) => {
//                                                                                 const nombreClicksAnnee = clickYearResults[0].nombre_clicks_annee;

//                                                                                 fetchData(`
//                                                                                     SELECT
//                                                                                         COUNT(DISTINCT page) AS nombre_pages_visitees_annee
//                                                                                     FROM
//                                                                                         interactions
//                                                                                     WHERE
//                                                                                         event = 'visit'
//                                                                                         AND tracking_id = ?
//                                                                                         AND timestamp >= ?
//                                                                                         AND timestamp < ?
//                                                                                 `, [trackingId, startOfThisYear, endOfThisYear], (pageYearResults) => {
//                                                                                     const nombrePagesVisiteesAnnee = pageYearResults[0].nombre_pages_visitees_annee;

//                                                                                     fetchData(`
//                                                                                         SELECT
//                                                                                             COUNT(*) AS nombre_visiteurs_annee
//                                                                                         FROM
//                                                                                             interactions
//                                                                                         WHERE
//                                                                                             event = 'visit'
//                                                                                             AND tracking_id = ?
//                                                                                             AND timestamp >= ?
//                                                                                             AND timestamp < ?
//                                                                                     `, [trackingId, startOfThisYear, endOfThisYear], (visitorYearResults) => {
//                                                                                         const nombreVisiteursAnnee = visitorYearResults[0].nombre_visiteurs_annee;

//                                                                                         // Calcul des différences avec les périodes précédentes
//                                                                                         fetchData(`
//                                                                                             SELECT
//                                                                                                 COUNT(DISTINCT page) AS nombre_pages_visitees_jour_precedent
//                                                                                             FROM
//                                                                                                 interactions
//                                                                                             WHERE
//                                                                                                 event = 'visit'
//                                                                                                 AND tracking_id = ?
//                                                                                                 AND timestamp >= ?
//                                                                                                 AND timestamp < ?
//                                                                                         `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (pageYesterdayResults) => {
//                                                                                             const nombrePagesVisiteesJourPrecedent = pageYesterdayResults[0].nombre_pages_visitees_jour_precedent;
//                                                                                             const differencePagesVisiteesJour = nombrePagesVisiteesAujourdhui - nombrePagesVisiteesJourPrecedent;
//                                                                                             let messageDifferencePagesVisiteesJour;
//                                                                                             let differenceAbsoluePagesVisiteesJour;

//                                                                                             if (differencePagesVisiteesJour > 0) {
//                                                                                                 messageDifferencePagesVisiteesJour = 'augmenter';
//                                                                                                 differenceAbsoluePagesVisiteesJour = differencePagesVisiteesJour;
//                                                                                             } else if (differencePagesVisiteesJour < 0) {
//                                                                                                 messageDifferencePagesVisiteesJour = 'diminuer';
//                                                                                             } else {
//                                                                                                 // Dans le cas où la différence est égale à zéro
//                                                                                                 messageDifferencePagesVisiteesJour = 'inchangé';
//                                                                                                 differenceAbsoluePagesVisiteesJour = 0;
//                                                                                             }

//                                                                                             fetchData(`
//                                                                                                 SELECT
//                                                                                                     COUNT(*) AS nombre_visiteurs_jour_precedent
//                                                                                                 FROM
//                                                                                                     interactions
//                                                                                                 WHERE
//                                                                                                     event = 'visit'
//                                                                                                     AND tracking_id = ?
//                                                                                                     AND timestamp >= ?
//                                                                                                     AND timestamp < ?
//                                                                                             `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (visitorYesterdayResults) => {
//                                                                                                 const nombreVisiteursJourPrecedent = visitorYesterdayResults[0].nombre_visiteurs_jour_precedent;
//                                                                                                 const differenceVisiteursJour = nombreVisiteursAujourdhui - nombreVisiteursJourPrecedent;
//                                                                                                 let messageDifferenceVisiteursJour;
//                                                                                                 let differenceAbsolueVisiteursJour;

//                                                                                                 if (differenceVisiteursJour > 0) {
//                                                                                                     messageDifferenceVisiteursJour = 'augmenter';
//                                                                                                     differenceAbsolueVisiteursJour = differenceVisiteursJour;
//                                                                                                 } else if (differenceVisiteursJour < 0) {
//                                                                                                     messageDifferenceVisiteursJour = 'diminuer';
//                                                                                                 } else {
//                                                                                                     // Dans le cas où la différence est égale à zéro
//                                                                                                     messageDifferenceVisiteursJour = 'inchangé';
//                                                                                                     differenceAbsolueVisiteursJour = 0;
//                                                                                                 }


//                                                                                                 fetchData(`
//                                                                                                     SELECT
//                                                                                                         SUM(duration) AS total_duree_jour_precedent
//                                                                                                     FROM
//                                                                                                         interactions
//                                                                                                     WHERE
//                                                                                                         event = 'visit'
//                                                                                                         AND tracking_id = ?
//                                                                                                         AND timestamp >= ?
//                                                                                                         AND timestamp < ?
//                                                                                                 `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (durationYesterdayResults) => {
//                                                                                                     const totalDurationJourPrecedent = formatDuration(durationYesterdayResults[0].total_duree_jour_precedent);
//                                                                                                     const totalDurationJourPrecedentInSeconds = durationYesterdayResults[0].total_duree_jour_precedent;
//                                                                                                     const totalDurationAujourdhuiInSeconds = durationTodayResults[0].total_duree_aujourdhui;

//                                                                                                     const differenceDurationJour = totalDurationAujourdhuiInSeconds - totalDurationJourPrecedentInSeconds;


//                                                                                                     let messageDifferenceDurationJour;
//                                                                                                     let differenceAbsolueDurationJour;

//                                                                                                     if (differenceDurationJour > 0) {
//                                                                                                         messageDifferenceDurationJour = 'augmenter';
//                                                                                                         differenceAbsolueDurationJour = formatDuration(differenceDurationJour);
//                                                                                                     } else if (differenceDurationJour < 0) {
//                                                                                                         messageDifferenceDurationJour = 'diminuer';
//                                                                                                     } else {
//                                                                                                         // Dans le cas où la différence est égale à zéro
//                                                                                                         messageDifferenceDurationJour = 'inchangé';
//                                                                                                         differenceAbsolueDurationJour = '0 heures 0 minutes 0 secondes';
//                                                                                                     }

//                                                                                                     fetchData(`
//                                                                                                         SELECT
//                                                                                                             COUNT(DISTINCT userAgent) AS nombre_user_agents_jour_precedent
//                                                                                                         FROM
//                                                                                                             interactions
//                                                                                                         WHERE
//                                                                                                             tracking_id = ?
//                                                                                                             AND timestamp >= ?
//                                                                                                             AND timestamp < ?
//                                                                                                     `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (userAgentYesterdayResults) => {
//                                                                                                         const nombreUserAgentsJourPrecedent = userAgentYesterdayResults[0].nombre_user_agents_jour_precedent;
//                                                                                                         const differenceUserAgentsJour = nombreUserAgentsAujourdhui - nombreUserAgentsJourPrecedent;
//                                                                                                         let messageDifferenceUserAgentsJour;
//                                                                                                         let differenceAbsolueUserAgentsJour;

//                                                                                                         if (differenceVisiteursJour > 0) {
//                                                                                                             messageDifferenceUserAgentsJour = 'augmenter';
//                                                                                                             differenceAbsolueUserAgentsJour = differenceUserAgentsJour;
//                                                                                                         } else if (differenceUserAgentsJour < 0) {
//                                                                                                             messageDifferenceUserAgentsJour = 'diminuer';
//                                                                                                         } else {
//                                                                                                             // Dans le cas où la différence est égale à zéro
//                                                                                                             messageDifferenceUserAgentsJour = 'inchangé';
//                                                                                                             differenceAbsolueUserAgentsJour = 0;
//                                                                                                         }

//                                                                                                         fetchData(`
//                                                                                                             SELECT
//                                                                                                                 COUNT(*) AS nombre_clicks_jour_precedent
//                                                                                                             FROM
//                                                                                                                 interactions
//                                                                                                             WHERE
//                                                                                                                 event = 'click'
//                                                                                                                 AND tracking_id = ?
//                                                                                                                 AND timestamp >= ?
//                                                                                                                 AND timestamp < ?
//                                                                                                         `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (clickYesterdayResults) => {
//                                                                                                             const nombreClicksJourPrecedent = clickYesterdayResults[0].nombre_clicks_jour_precedent;
//                                                                                                             const differenceClicksJour = nombreClicksAujourdhui - totalDurationJourPrecedent;
//                                                                                                             let messageDifferenceClicksJour;
//                                                                                                             let differenceAbsolueClicksJour;

//                                                                                                             if (differenceClicksJour > 0) {
//                                                                                                                 messageDifferenceClicksJour = 'augmenter';
//                                                                                                                 differenceAbsolueClicksJour = differenceClicksJour;
//                                                                                                             } else if (differenceClicksJour < 0) {
//                                                                                                                 messageDifferenceClicksJour = 'diminuer';
//                                                                                                             } else {
//                                                                                                                 // Dans le cas où la différence est égale à zéro
//                                                                                                                 messageDifferenceClicksJour = 'inchangé';
//                                                                                                                 differenceAbsolueClicksJour = 0;
//                                                                                                             }

//                                                                                                             fetchData(`
//                                                                                                                 SELECT
//                                                                                                                     COUNT(DISTINCT page) AS nombre_pages_visitees_semaine_precedente
//                                                                                                                 FROM
//                                                                                                                     interactions
//                                                                                                                 WHERE
//                                                                                                                     event = 'visit'
//                                                                                                                     AND tracking_id = ?
//                                                                                                                     AND timestamp >= ?
//                                                                                                                     AND timestamp < ?
//                                                                                                             `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (pageLastWeekResults) => {
//                                                                                                                 const nombrePagesVisiteesSemainePrecedente = pageLastWeekResults[0].nombre_pages_visitees_semaine_precedente;
//                                                                                                                 const differencePagesVisiteesSemaine = nombrePagesVisiteesSemaine - nombrePagesVisiteesSemainePrecedente;
//                                                                                                                 let messageDifferencePagesVisiteesSemaine;
//                                                                                                                 let differenceAbsoluePagesVisiteesSemaine;

//                                                                                                                 if (differencePagesVisiteesSemaine > 0) {
//                                                                                                                     messageDifferencePagesVisiteesSemaine = 'augmenter';
//                                                                                                                     differenceAbsoluePagesVisiteesSemaine = differencePagesVisiteesSemaine;
//                                                                                                                 } else if (differencePagesVisiteesSemaine < 0) {
//                                                                                                                     messageDifferencePagesVisiteesSemaine = 'diminuer';
//                                                                                                                 } else {
//                                                                                                                     // Dans le cas où la différence est égale à zéro
//                                                                                                                     messageDifferencePagesVisiteesSemaine = 'inchangé';
//                                                                                                                     differenceAbsoluePagesVisiteesSemaine = 0;
//                                                                                                                 }

//                                                                                                                 fetchData(`
//                                                                                                                     SELECT
//                                                                                                                         COUNT(*) AS nombre_visiteurs_semaine_precedente
//                                                                                                                     FROM
//                                                                                                                         interactions
//                                                                                                                     WHERE
//                                                                                                                         event = 'visit'
//                                                                                                                         AND tracking_id = ?
//                                                                                                                         AND timestamp >= ?
//                                                                                                                         AND timestamp < ?
//                                                                                                                 `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (visitorLastWeekResults) => {
//                                                                                                                     const nombreVisiteursSemainePrecedente = visitorLastWeekResults[0].nombre_visiteurs_semaine_precedente;
//                                                                                                                     const differenceVisiteursSemaine = nombreVisiteursSemaine - nombreVisiteursSemainePrecedente;
//                                                                                                                     let messageDifferenceVisiteursSemaine;
//                                                                                                                     let differenceAbsolueVisiteursSemaine;

//                                                                                                                     if (differenceVisiteursSemaine > 0) {
//                                                                                                                         messageDifferenceVisiteursSemaine = 'augmenter';
//                                                                                                                         differenceAbsolueVisiteursSemaine = differenceVisiteursSemaine;
//                                                                                                                     } else if (differenceVisiteursSemaine < 0) {
//                                                                                                                         messageDifferenceVisiteursSemaine = 'diminuer';
//                                                                                                                     } else {
//                                                                                                                         // Dans le cas où la différence est égale à zéro
//                                                                                                                         messageDifferenceVisiteursSemaine = 'inchangé';
//                                                                                                                         differenceAbsolueVisiteursSemaine = 0;
//                                                                                                                     }

//                                                                                                                     fetchData(`
//                                                                                                                         SELECT
//                                                                                                                             SUM(duration) AS total_duree_semaine_precedente
//                                                                                                                         FROM
//                                                                                                                             interactions
//                                                                                                                         WHERE
//                                                                                                                             event = 'visit'
//                                                                                                                             AND tracking_id = ?
//                                                                                                                             AND timestamp >= ?
//                                                                                                                             AND timestamp < ?
//                                                                                                                     `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (durationLastWeekResults) => {
//                                                                                                                         const totalDurationSemainePrecedente = formatDuration(durationLastWeekResults[0].total_duree_semaine_precedente);
//                                                                                                                         const totalDurationSemainePrecedentInSeconds = durationLastWeekResults[0].total_duree_semaine_precedente;
//                                                                                                                         const totalDurationSemaineInSeconds = durationWeekResults[0].total_duree_semaine;


//                                                                                                                         const differenceDurationSemaine = totalDurationSemaineInSeconds - totalDurationSemainePrecedentInSeconds;
//                                                                                                                         let messageDifferenceDurationSemaine;
//                                                                                                                         let differenceAbsolueDurationSemaine;

//                                                                                                                         if (differenceDurationSemaine > 0) {
//                                                                                                                             messageDifferenceDurationSemaine = 'augmenter';
//                                                                                                                             differenceAbsolueDurationSemaine = formatDuration(differenceDurationSemaine);
//                                                                                                                         } else if (differenceDurationSemaine < 0) {
//                                                                                                                             messageDifferenceDurationSemaine = 'diminuer';
//                                                                                                                         } else {
//                                                                                                                             // Dans le cas où la différence est égale à zéro
//                                                                                                                             messageDifferenceDurationSemaine = 'inchangé';
//                                                                                                                             differenceAbsolueDurationSemaine = '0 heures 0 minutes 0 secondes';
//                                                                                                                         }
//                                                                                                                         fetchData(`
//                                                                                                                             SELECT
//                                                                                                                                 COUNT(DISTINCT userAgent) AS nombre_user_agents_semaine_precedente
//                                                                                                                             FROM
//                                                                                                                                 interactions
//                                                                                                                             WHERE
//                                                                                                                                 tracking_id = ?
//                                                                                                                                 AND timestamp >= ?
//                                                                                                                                 AND timestamp < ?
//                                                                                                                         `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (userAgentLastWeekResults) => {
//                                                                                                                             const nombreUserAgentsSemainePrecedente = userAgentLastWeekResults[0].nombre_user_agents_semaine_precedente;
//                                                                                                                             const differenceUserAgentsSemaine = nombreUserAgentsSemaine - nombreUserAgentsSemainePrecedente;
//                                                                                                                             let messageDifferenceUserAgentsSemaine;
//                                                                                                                             let differenceAbsolueUserAgentsSemaine;

//                                                                                                                             if (differenceUserAgentsSemaine > 0) {
//                                                                                                                                 messageDifferenceUserAgentsSemaine = 'augmenter';
//                                                                                                                                 differenceAbsolueUserAgentsSemaine = differenceUserAgentsSemaine;
//                                                                                                                             } else if (differenceUserAgentsSemaine < 0) {
//                                                                                                                                 messageDifferenceUserAgentsSemaine = 'diminuer';
//                                                                                                                             } else {
//                                                                                                                                 // Dans le cas où la différence est égale à zéro
//                                                                                                                                 messageDifferenceUserAgentsSemaine = 'inchangé';
//                                                                                                                                 differenceAbsolueUserAgentsSemaine = 0;
//                                                                                                                             }

//                                                                                                                             fetchData(`
//                                                                                                                                 SELECT
//                                                                                                                                     COUNT(*) AS nombre_clicks_semaine_precedente
//                                                                                                                                 FROM
//                                                                                                                                     interactions
//                                                                                                                                 WHERE
//                                                                                                                                     event = 'click'
//                                                                                                                                     AND tracking_id = ?
//                                                                                                                                     AND timestamp >= ?
//                                                                                                                                     AND timestamp < ?
//                                                                                                                             `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (clickLastWeekResults) => {
//                                                                                                                                 const nombreClicksSemainePrecedente = clickLastWeekResults[0].nombre_clicks_semaine_precedente;
//                                                                                                                                 const differenceClicksSemaine = nombreClicksSemaine - nombreClicksSemainePrecedente;
//                                                                                                                                 let messageDifferenceClicksSemaine;
//                                                                                                                                 let differenceAbsolueClicksSemaine;

//                                                                                                                                 if (differenceClicksSemaine > 0) {
//                                                                                                                                     messageDifferenceClicksSemaine = 'augmenter';
//                                                                                                                                     differenceAbsolueClicksSemaine = differenceClicksSemaine;
//                                                                                                                                 } else if (differenceClicksSemaine < 0) {
//                                                                                                                                     messageDifferenceClicksSemaine = 'diminuer';
//                                                                                                                                 } else {
//                                                                                                                                     // Dans le cas où la différence est égale à zéro
//                                                                                                                                     messageDifferenceClicksSemaine = 'inchangé';
//                                                                                                                                     differenceAbsolueClicksSemaine = 0;
//                                                                                                                                 }

//                                                                                                                                 fetchData(`
//                                                                                                                                     SELECT
//                                                                                                                                         COUNT(DISTINCT page) AS nombre_pages_visitees_mois_precedent
//                                                                                                                                     FROM
//                                                                                                                                         interactions
//                                                                                                                                     WHERE
//                                                                                                                                         event = 'visit'
//                                                                                                                                         AND tracking_id = ?
//                                                                                                                                         AND timestamp >= ?
//                                                                                                                                         AND timestamp < ?
//                                                                                                                                 `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (pageLastMonthResults) => {
//                                                                                                                                     const nombrePagesVisiteesMoisPrecedent = pageLastMonthResults[0].nombre_pages_visitees_mois_precedent;
//                                                                                                                                     const differencePagesVisiteesMois = nombrePagesVisiteesCeMois - nombrePagesVisiteesMoisPrecedent;
//                                                                                                                                     let messageDifferencePagesVisiteesMois;
//                                                                                                                                     let differenceAbsoluePagesVisiteesMois;

//                                                                                                                                     if (differencePagesVisiteesMois > 0) {
//                                                                                                                                         messageDifferencePagesVisiteesMois = 'augmenter';
//                                                                                                                                         differenceAbsoluePagesVisiteesMois = differencePagesVisiteesMois;
//                                                                                                                                     } else if (differencePagesVisiteesMois < 0) {
//                                                                                                                                         messageDifferencePagesVisiteesMois = 'diminuer';
//                                                                                                                                     } else {
//                                                                                                                                         // Dans le cas où la différence est égale à zéro
//                                                                                                                                         messageDifferencePagesVisiteesMois = 'inchangé';
//                                                                                                                                         differenceAbsoluePagesVisiteesMois = 0;
//                                                                                                                                     }

//                                                                                                                                     fetchData(`
//                                                                                                                                         SELECT
//                                                                                                                                             COUNT(*) AS nombre_visiteurs_mois_precedent
//                                                                                                                                         FROM
//                                                                                                                                             interactions
//                                                                                                                                         WHERE
//                                                                                                                                             event = 'visit'
//                                                                                                                                             AND tracking_id = ?
//                                                                                                                                             AND timestamp >= ?
//                                                                                                                                             AND timestamp < ?
//                                                                                                                                     `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (visitorLastMonthResults) => {
//                                                                                                                                         const nombreVisiteursMoisPrecedent = visitorLastMonthResults[0].nombre_visiteurs_mois_precedent;
//                                                                                                                                         const differenceVisiteursMois = nombreVisiteursCeMois - nombreVisiteursMoisPrecedent;
//                                                                                                                                         let messageDifferenceVisiteursMois;
//                                                                                                                                         let differenceAbsolueVisiteursMois;

//                                                                                                                                         if (differenceVisiteursMois > 0) {
//                                                                                                                                             messageDifferenceVisiteursMois = 'augmenter';
//                                                                                                                                             differenceAbsolueVisiteursMois = differenceVisiteursMois;
//                                                                                                                                         } else if (differenceVisiteursMois < 0) {
//                                                                                                                                             messageDifferenceVisiteursMois = 'diminuer';
//                                                                                                                                         } else {
//                                                                                                                                             // Dans le cas où la différence est égale à zéro
//                                                                                                                                             messageDifferenceVisiteursMois = 'inchangé';
//                                                                                                                                             differenceAbsolueVisiteursMois = 0;
//                                                                                                                                         }

//                                                                                                                                         fetchData(`
//                                                                                                                                             SELECT
//                                                                                                                                                 SUM(duration) AS total_duree_mois_precedent
//                                                                                                                                             FROM
//                                                                                                                                                 interactions
//                                                                                                                                             WHERE
//                                                                                                                                                 event = 'visit'
//                                                                                                                                                 AND tracking_id = ?
//                                                                                                                                                 AND timestamp >= ?
//                                                                                                                                                 AND timestamp < ?
//                                                                                                                                         `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (durationLastMonthResults) => {
//                                                                                                                                             const totalDurationMoisPrecedent = formatDuration(durationLastMonthResults[0].total_duree_mois_precedent);
//                                                                                                                                             const totalDurationMoisPrecedentInSeconds = durationLastMonthResults[0].total_duree_mois_precedent;
//                                                                                                                                             const totalDurationMoisInSeconds = durationMonthResults[0].total_duree_ce_mois;

//                                                                                                                                             const differenceDurationMois = totalDurationMoisInSeconds - totalDurationMoisPrecedentInSeconds;
//                                                                                                                                             let messageDifferenceDurationMois;
//                                                                                                                                             let differenceAbsolueDurationMois;

//                                                                                                                                             if (differenceDurationMois > 0) {
//                                                                                                                                                 messageDifferenceDurationMois = 'augmenter';
//                                                                                                                                                 differenceAbsolueDurationMois = formatDuration(differenceDurationMois);
//                                                                                                                                             } else if (differenceDurationMois < 0) {
//                                                                                                                                                 messageDifferenceDurationMois = 'diminuer';
//                                                                                                                                             } else {
//                                                                                                                                                 // Dans le cas où la différence est égale à zéro
//                                                                                                                                                 messageDifferenceDurationMois = 'inchangé';
//                                                                                                                                                 differenceAbsolueDurationMois = '0 heures 0 minutes 0 secondes';
//                                                                                                                                             }

//                                                                                                                                             fetchData(`
//                                                                                                                                                 SELECT
//                                                                                                                                                     COUNT(DISTINCT userAgent) AS nombre_user_agents_mois_precedent
//                                                                                                                                                 FROM
//                                                                                                                                                     interactions
//                                                                                                                                                 WHERE
//                                                                                                                                                     tracking_id = ?
//                                                                                                                                                     AND timestamp >= ?
//                                                                                                                                                     AND timestamp < ?
//                                                                                                                                             `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (userAgentLastMonthResults) => {
//                                                                                                                                                 const nombreUserAgentsMoisPrecedent = userAgentLastMonthResults[0].nombre_user_agents_mois_precedent;
//                                                                                                                                                 const differenceUserAgentsMois = nombreUserAgentsMois - nombreUserAgentsMoisPrecedent;
//                                                                                                                                                 let messageDifferenceUserAgentsMois;
//                                                                                                                                                 let differenceAbsolueUserAgentsMois;

//                                                                                                                                                 if (differenceUserAgentsMois > 0) {
//                                                                                                                                                     messageDifferenceUserAgentsMois = 'augmenter';
//                                                                                                                                                     differenceAbsolueUserAgentsMois = differenceUserAgentsMois;
//                                                                                                                                                 } else if (differenceUserAgentsMois < 0) {
//                                                                                                                                                     messageDifferenceUserAgentsMois = 'diminuer';
//                                                                                                                                                 } else {
//                                                                                                                                                     // Dans le cas où la différence est égale à zéro
//                                                                                                                                                     messageDifferenceUserAgentsMois = 'inchangé';
//                                                                                                                                                     differenceAbsolueUserAgentsMois = 0;
//                                                                                                                                                 }

//                                                                                                                                                 fetchData(`
//                                                                                                                                                     SELECT
//                                                                                                                                                         COUNT(*) AS nombre_clicks_mois_precedent
//                                                                                                                                                     FROM
//                                                                                                                                                         interactions
//                                                                                                                                                     WHERE
//                                                                                                                                                         event = 'click'
//                                                                                                                                                         AND tracking_id = ?
//                                                                                                                                                         AND timestamp >= ?
//                                                                                                                                                         AND timestamp < ?
//                                                                                                                                                 `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (clickLastMonthResults) => {
//                                                                                                                                                     const nombreClicksMoisPrecedent = clickLastMonthResults[0].nombre_clicks_mois_precedent;
//                                                                                                                                                     const differenceClicksMois = nombreClicksCeMois - nombreClicksMoisPrecedent;
//                                                                                                                                                     let messageDifferenceClicksMois;
//                                                                                                                                                     let differenceAbsolueClicksMois;

//                                                                                                                                                     if (differenceClicksMois > 0) {
//                                                                                                                                                         messageDifferenceClicksMois = 'augmenter';
//                                                                                                                                                         differenceAbsolueClicksMois = differenceClicksMois;
//                                                                                                                                                     } else if (differenceClicksMois < 0) {
//                                                                                                                                                         messageDifferenceClicksMois = 'diminuer';
//                                                                                                                                                     } else {
//                                                                                                                                                         // Dans le cas où la différence est égale à zéro
//                                                                                                                                                         messageDifferenceClicksMois = 'inchangé';
//                                                                                                                                                         differenceAbsolueClicksMois = 0;
//                                                                                                                                                     }

//                                                                                                                                                     fetchData(`
//                                                                                                                                                         SELECT
//                                                                                                                                                             COUNT(DISTINCT page) AS nombre_pages_visitees_annee_precedente
//                                                                                                                                                         FROM
//                                                                                                                                                             interactions
//                                                                                                                                                         WHERE
//                                                                                                                                                             event = 'visit'
//                                                                                                                                                             AND tracking_id = ?
//                                                                                                                                                             AND timestamp >= ?
//                                                                                                                                                             AND timestamp < ?
//                                                                                                                                                     `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (pageLastYearResults) => {
//                                                                                                                                                         const nombrePagesVisiteesAnneePrecedente = pageLastYearResults[0].nombre_pages_visitees_annee_precedente;
//                                                                                                                                                         const differencePagesVisiteesAnnee = nombrePagesVisiteesAnnee - nombrePagesVisiteesAnneePrecedente;
//                                                                                                                                                         let messageDifferencePagesVisiteesAnnee;
//                                                                                                                                                         let differenceAbsoluePagesVisiteesAnnee;

//                                                                                                                                                         if (differencePagesVisiteesAnnee > 0) {
//                                                                                                                                                             messageDifferencePagesVisiteesAnnee = 'augmenter';
//                                                                                                                                                             differenceAbsoluePagesVisiteesAnnee = differencePagesVisiteesAnnee;
//                                                                                                                                                         } else if (differencePagesVisiteesAnnee < 0) {
//                                                                                                                                                             messageDifferencePagesVisiteesAnnee = 'diminuer';
//                                                                                                                                                         } else {
//                                                                                                                                                             // Dans le cas où la différence est égale à zéro
//                                                                                                                                                             messageDifferencePagesVisiteesAnnee = 'inchangé';
//                                                                                                                                                             differenceAbsoluePagesVisiteesAnnee = 0;
//                                                                                                                                                         }

//                                                                                                                                                         fetchData(`
//                                                                                                                                                             SELECT
//                                                                                                                                                                 COUNT(*) AS nombre_visiteurs_annee_precedente
//                                                                                                                                                             FROM
//                                                                                                                                                                 interactions
//                                                                                                                                                             WHERE
//                                                                                                                                                                 event = 'visit'
//                                                                                                                                                                 AND tracking_id = ?
//                                                                                                                                                                 AND timestamp >= ?
//                                                                                                                                                                 AND timestamp < ?
//                                                                                                                                                         `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (visitorLastYearResults) => {
//                                                                                                                                                             const nombreVisiteursAnneePrecedente = visitorLastYearResults[0].nombre_visiteurs_annee_precedente;
//                                                                                                                                                             const differenceVisiteursAnnee = nombreVisiteursAnnee - nombreVisiteursAnneePrecedente;
//                                                                                                                                                             let messageDifferenceVisiteursAnnee;
//                                                                                                                                                             let differenceAbsolueVisiteursAnnee;

//                                                                                                                                                             if (differenceVisiteursAnnee > 0) {
//                                                                                                                                                                 messageDifferenceVisiteursAnnee = 'augmenter';
//                                                                                                                                                                 differenceAbsolueVisiteursAnnee = differenceVisiteursAnnee;
//                                                                                                                                                             } else if (differenceVisiteursAnnee < 0) {
//                                                                                                                                                                 messageDifferenceVisiteursAnnee = 'diminuer';
//                                                                                                                                                             } else {
//                                                                                                                                                                 // Dans le cas où la différence est égale à zéro
//                                                                                                                                                                 messageDifferenceVisiteursAnnee = 'inchangé';
//                                                                                                                                                                 differenceAbsolueVisiteursAnnee = 0;
//                                                                                                                                                             }

//                                                                                                                                                             fetchData(`
//                                                                                                                                                                 SELECT
//                                                                                                                                                                     SUM(duration) AS total_duree_annee_precedente
//                                                                                                                                                                 FROM
//                                                                                                                                                                     interactions
//                                                                                                                                                                 WHERE
//                                                                                                                                                                     event = 'visit'
//                                                                                                                                                                     AND tracking_id = ?
//                                                                                                                                                                     AND timestamp >= ?
//                                                                                                                                                                     AND timestamp < ?
//                                                                                                                                                             `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (durationLastYearResults) => {
//                                                                                                                                                                 const totalDurationAnneePrecedente = formatDuration(durationLastYearResults[0].total_duree_annee_precedente);
//                                                                                                                                                                 const totalDurationAnneePrecedentInSeconds = durationLastYearResults[0].total_duree_annee_precedente;
//                                                                                                                                                                 const totalDurationAnneeInSeconds = durationYearResults[0].total_duree_annee;

//                                                                                                                                                                 const differenceDurationAnnee = totalDurationAnneeInSeconds - totalDurationAnneePrecedentInSeconds;
//                                                                                                                                                                 let messageDifferenceDurationAnnee;
//                                                                                                                                                                 let differenceAbsolueDurationAnnee;

//                                                                                                                                                                 if (differenceDurationAnnee > 0) {
//                                                                                                                                                                     messageDifferenceDurationAnnee = 'augmenter';
//                                                                                                                                                                     differenceAbsolueDurationAnnee = formatDuration(differenceDurationAnnee);
//                                                                                                                                                                 } else if (differenceDurationAnnee < 0) {
//                                                                                                                                                                     messageDifferenceDurationAnnee = 'diminuer';
//                                                                                                                                                                 } else {
//                                                                                                                                                                     // Dans le cas où la différence est égale à zéro
//                                                                                                                                                                     messageDifferenceDurationAnnee = 'inchangé';
//                                                                                                                                                                     differenceAbsolueDurationAnnee = '0 heures 0 minutes 0 secondes';
//                                                                                                                                                                 }

//                                                                                                                                                                 fetchData(`
//                                                                                                                                                                     SELECT
//                                                                                                                                                                         COUNT(DISTINCT userAgent) AS nombre_user_agents_annee_precedente
//                                                                                                                                                                     FROM
//                                                                                                                                                                         interactions
//                                                                                                                                                                     WHERE
//                                                                                                                                                                         tracking_id = ?
//                                                                                                                                                                         AND timestamp >= ?
//                                                                                                                                                                         AND timestamp < ?
//                                                                                                                                                                 `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (userAgentLastYearResults) => {
//                                                                                                                                                                     const nombreUserAgentsAnneePrecedente = userAgentLastYearResults[0].nombre_user_agents_annee_precedente;
//                                                                                                                                                                     const differenceUserAgentsAnnee = nombreUserAgentsAnnee - nombreUserAgentsAnneePrecedente;
//                                                                                                                                                                     let messageDifferenceUserAgentsAnnee;
//                                                                                                                                                                     let differenceAbsolueUserAgentsAnnee;

//                                                                                                                                                                     if (differenceUserAgentsAnnee > 0) {
//                                                                                                                                                                         messageDifferenceUserAgentsAnnee = 'augmenter';
//                                                                                                                                                                         differenceAbsolueUserAgentsAnnee = differenceUserAgentsAnnee;
//                                                                                                                                                                     } else if (differenceUserAgentsAnnee < 0) {
//                                                                                                                                                                         messageDifferenceUserAgentsAnnee = 'diminuer';
//                                                                                                                                                                     } else {
//                                                                                                                                                                         // Dans le cas où la différence est égale à zéro
//                                                                                                                                                                         messageDifferenceUserAgentsAnnee = 'inchangé';
//                                                                                                                                                                         differenceAbsolueUserAgentsAnnee = 0;
//                                                                                                                                                                     }

//                                                                                                                                                                     fetchData(`
//                                                                                                                                                                         SELECT
//                                                                                                                                                                             COUNT(*) AS nombre_clicks_annee_precedente
//                                                                                                                                                                         FROM
//                                                                                                                                                                             interactions
//                                                                                                                                                                         WHERE
//                                                                                                                                                                             event = 'click'
//                                                                                                                                                                             AND tracking_id = ?
//                                                                                                                                                                             AND timestamp >= ?
//                                                                                                                                                                             AND timestamp < ?
//                                                                                                                                                                     `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (clickLastYearResults) => {
//                                                                                                                                                                         const nombreClicksAnneePrecedente = clickLastYearResults[0].nombre_clicks_annee_precedente;
//                                                                                                                                                                         const differenceClicksAnnee = nombreClicksAnnee - nombreClicksAnneePrecedente;
//                                                                                                                                                                         let messageDifferenceClicksAnnee;
//                                                                                                                                                                         let differenceAbsolueClicksAnnee;

//                                                                                                                                                                         if (differenceVisiteursJour > 0) {
//                                                                                                                                                                             messageDifferenceClicksAnnee = 'augmenter';
//                                                                                                                                                                             differenceAbsolueClicksAnnee = differenceClicksAnnee;
//                                                                                                                                                                         } else if (differenceClicksAnnee < 0) {
//                                                                                                                                                                             messageDifferenceClicksAnnee = 'diminuer';
//                                                                                                                                                                         } else {
//                                                                                                                                                                             // Dans le cas où la différence est égale à zéro
//                                                                                                                                                                             messageDifferenceClicksAnnee = 'inchangé';
//                                                                                                                                                                             differenceAbsolueClicksAnnee = 0;
//                                                                                                                                                                         }

//                                                                                                                                                                         res.render('rapport', {
//                                                                                                                                                                             client: clientResults[0],
//                                                                                                                                                                             today: formattedDate,
//                                                                                                                                                                             yesterday: formattedDateYesterday,

//                                                                                                                                                                             startOfWeek: startOfWeekFormatted,
//                                                                                                                                                                             endOfWeek: endOfWeekFormatted,

//                                                                                                                                                                             startOfLastWeek: startOfWeekFormattedYesterday,
//                                                                                                                                                                             endOfLastWeek: endOfWeekFormattedYesterday,

//                                                                                                                                                                             startOfMonth: startOfMonthFormatted,
//                                                                                                                                                                             endOfMonth: endOfMonthFormatted,

//                                                                                                                                                                             startOfLastMonth: startOfMonthFormattedYesterday,
//                                                                                                                                                                             endOfLastMonth: endOfMonthFormattedYesterday,

//                                                                                                                                                                             startOfYear: startOfYearFormatted,
//                                                                                                                                                                             endOfYear: endOfYearFormatted,

//                                                                                                                                                                             startOfLastYear: startOfYearFormattedYesterday,
//                                                                                                                                                                             endOfLastYear: endOfYearFormattedYesterday,

//                                                                                                                                                                             nombreUserAgentsAujourdhui,
//                                                                                                                                                                             nombreUserAgentsSemaine,
//                                                                                                                                                                             nombreUserAgentsMois,
//                                                                                                                                                                             nombreUserAgentsAnnee,

//                                                                                                                                                                             nombreVisiteursAujourdhui,
//                                                                                                                                                                             nombreVisiteursSemaine,
//                                                                                                                                                                             nombreVisiteursCeMois,
//                                                                                                                                                                             nombreVisiteursAnnee,

//                                                                                                                                                                             nombrePagesVisiteesAujourdhui,
//                                                                                                                                                                             nombrePagesVisiteesSemaine,
//                                                                                                                                                                             nombrePagesVisiteesCeMois,
//                                                                                                                                                                             nombrePagesVisiteesAnnee,

//                                                                                                                                                                             totalDurationAujourdhui,
//                                                                                                                                                                             totalDurationSemaine,
//                                                                                                                                                                             totalDurationAnnee,
//                                                                                                                                                                             totalDurationCeMois,

//                                                                                                                                                                             nombreClicksAujourdhui,
//                                                                                                                                                                             nombreClicksSemaine,
//                                                                                                                                                                             nombreClicksCeMois,
//                                                                                                                                                                             nombreClicksAnnee,

//                                                                                                                                                                             nombreVisiteursJourPrecedent,
//                                                                                                                                                                             nombreVisiteursSemainePrecedente,
//                                                                                                                                                                             nombreVisiteursMoisPrecedent,
//                                                                                                                                                                             nombreVisiteursAnneePrecedente,

//                                                                                                                                                                             nombrePagesVisiteesJourPrecedent,
//                                                                                                                                                                             nombrePagesVisiteesSemainePrecedente,
//                                                                                                                                                                             nombrePagesVisiteesMoisPrecedent,
//                                                                                                                                                                             nombrePagesVisiteesAnneePrecedente,

//                                                                                                                                                                             nombreUserAgentsJourPrecedent,
//                                                                                                                                                                             nombreUserAgentsSemainePrecedente,
//                                                                                                                                                                             nombreUserAgentsMoisPrecedent,
//                                                                                                                                                                             nombreUserAgentsAnneePrecedente,

//                                                                                                                                                                             totalDurationJourPrecedent,
//                                                                                                                                                                             totalDurationSemainePrecedente,
//                                                                                                                                                                             totalDurationMoisPrecedent,
//                                                                                                                                                                             totalDurationAnneePrecedente,

//                                                                                                                                                                             nombreClicksJourPrecedent,
//                                                                                                                                                                             nombreClicksSemainePrecedente,
//                                                                                                                                                                             nombreClicksMoisPrecedent,
//                                                                                                                                                                             nombreClicksAnneePrecedente,
//                                                                                                                                                                             ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                                                             differenceAbsolueVisiteursJour,
//                                                                                                                                                                             messageVisiteursJour: `${messageDifferenceVisiteursJour}`,

//                                                                                                                                                                             differenceAbsoluePagesVisiteesJour,
//                                                                                                                                                                             messagePagesVisiteesJour: `${messageDifferencePagesVisiteesJour}`,

//                                                                                                                                                                             differenceAbsolueDurationJour,
//                                                                                                                                                                             messageDurationJour: `${messageDifferenceDurationJour}`,

//                                                                                                                                                                             differenceAbsolueUserAgentsJour,
//                                                                                                                                                                             messageUserAgentsJour: `${messageDifferenceUserAgentsJour}`,

//                                                                                                                                                                             differenceAbsolueClicksJour,
//                                                                                                                                                                             messageClicksJour: `${messageDifferenceClicksJour}`,
//                                                                                                                                                                             /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                                                             differenceAbsoluePagesVisiteesSemaine,
//                                                                                                                                                                             messagePagesVisiteesSemaine: `${messageDifferencePagesVisiteesSemaine}`,

//                                                                                                                                                                             differenceAbsolueVisiteursSemaine,
//                                                                                                                                                                             messageVisiteursSemaine: `${messageDifferenceVisiteursSemaine}`,

//                                                                                                                                                                             differenceAbsolueDurationSemaine,
//                                                                                                                                                                             messageDurationSemaine: `${messageDifferenceDurationSemaine}`,

//                                                                                                                                                                             differenceAbsolueUserAgentsSemaine,
//                                                                                                                                                                             messageUserAgentsSemaine: `${messageDifferenceUserAgentsSemaine}`,

//                                                                                                                                                                             differenceAbsolueClicksSemaine,
//                                                                                                                                                                             messageClicksSemaine: `${messageDifferenceClicksSemaine}`,

//                                                                                                                                                                             differenceAbsoluePagesVisiteesMois,
//                                                                                                                                                                             messagePagesVisiteesMois: `${messageDifferencePagesVisiteesMois}`,

//                                                                                                                                                                             differenceAbsolueVisiteursMois,
//                                                                                                                                                                             messageVisiteursMois: `${messageDifferenceVisiteursMois}`,

//                                                                                                                                                                             differenceAbsolueUserAgentsMois,
//                                                                                                                                                                             messageUserAgentsMois: `${messageDifferenceUserAgentsMois}`,

//                                                                                                                                                                             differenceAbsolueDurationMois,
//                                                                                                                                                                             messageDurationMois: `${messageDifferenceDurationMois}`,

//                                                                                                                                                                             differenceAbsolueUserAgentsMois,
//                                                                                                                                                                             messageUserAgentsMois: `${messageDifferenceUserAgentsMois}`,

//                                                                                                                                                                             differenceAbsolueClicksMois,
//                                                                                                                                                                             messageClicksMois: `${messageDifferenceClicksMois}`,

//                                                                                                                                                                             differenceAbsoluePagesVisiteesAnnee,
//                                                                                                                                                                             messagePagesVisiteesAnnee: `${messageDifferencePagesVisiteesAnnee}`,

//                                                                                                                                                                             differenceAbsolueVisiteursAnnee,
//                                                                                                                                                                             messageVisiteursAnnee: `${messageDifferenceVisiteursAnnee}`,

//                                                                                                                                                                             differenceAbsolueDurationAnnee,
//                                                                                                                                                                             messageDurationAnnee: `${messageDifferenceDurationAnnee}`,

//                                                                                                                                                                             differenceAbsolueUserAgentsAnnee,
//                                                                                                                                                                             messageUserAgentsAnnee: `${messageDifferenceUserAgentsAnnee}`,

//                                                                                                                                                                             differenceAbsolueClicksAnnee,
//                                                                                                                                                                             messageClicksAnnee: `${messageDifferenceClicksAnnee}`,
//                                                                                                                                                                         });
//                                                                                                                                                                     });
//                                                                                                                                                                 });
//                                                                                                                                                             });
//                                                                                                                                                         });
//                                                                                                                                                     });
//                                                                                                                                                 });
//                                                                                                                                             });
//                                                                                                                                         });
//                                                                                                                                     });
//                                                                                                                                 });
//                                                                                                                             });
//                                                                                                                         });
//                                                                                                                     });
//                                                                                                                 });
//                                                                                                             });
//                                                                                                         });
//                                                                                                     });
//                                                                                                 });
//                                                                                             });
//                                                                                         });
//                                                                                     });
//                                                                                 });
//                                                                             });
//                                                                         });
//                                                                     });
//                                                                 });
//                                                             });
//                                                         });
//                                                     });
//                                                 });
//                                             });
//                                         });
//                                     });
//                                 });
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// };

exports.getRapportData = (req, res) => {
    const trackingId = req.query.trackingId;
    // Récupérer la date d'aujourd'hui
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'long' });
    const year = today.getFullYear();
    const formattedDate = `${day} ${month} ${year}`;

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayYesterday = yesterday.getDate();
    const monthYesterday = yesterday.toLocaleString('default', { month: 'long' });
    const yearYesterday = yesterday.getFullYear();
    const formattedDateYesterday = `${dayYesterday} ${monthYesterday} ${yearYesterday}`;

    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const startOfThisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const endOfThisWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7);
    const startOfWeekFormatted = `${startOfThisWeek.getDate()} ${startOfThisWeek.toLocaleString('default', { month: 'long' })} ${startOfThisWeek.getFullYear()}`;
    const endOfWeekFormatted = `${endOfThisWeek.getDate()} ${endOfThisWeek.toLocaleString('default', { month: 'long' })} ${endOfThisWeek.getFullYear()}`;

    const startOfLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 7);
    const endOfLastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const startOfWeekFormattedYesterday = `${startOfLastWeek.getDate()} ${startOfLastWeek.toLocaleString('default', { month: 'long' })} ${startOfLastWeek.getFullYear()}`;
    const endOfWeekFormattedYesterday = `${endOfLastWeek.getDate()} ${endOfLastWeek.toLocaleString('default', { month: 'long' })} ${endOfLastWeek.getFullYear()}`;

    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfMonthFormatted = `${startOfThisMonth.getDate()} ${startOfThisMonth.toLocaleString('default', { month: 'long' })} ${startOfThisMonth.getFullYear()}`;
    const endOfMonthFormatted = `${endOfThisMonth.getDate()} ${endOfThisMonth.toLocaleString('default', { month: 'long' })} ${endOfThisMonth.getFullYear()}`;

    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    const startOfMonthFormattedYesterday = `${startOfLastMonth.getDate()} ${startOfLastMonth.toLocaleString('default', { month: 'long' })} ${startOfLastMonth.getFullYear()}`;
    const endOfMonthFormattedYesterday = `${endOfLastMonth.getDate()} ${endOfLastMonth.toLocaleString('default', { month: 'long' })} ${endOfLastMonth.getFullYear()}`;

    const startOfThisYear = new Date(today.getFullYear(), 0, 1);
    const endOfThisYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    const startOfYearFormatted = `${startOfThisYear.getDate()} ${startOfThisYear.toLocaleString('default', { month: 'long' })} ${startOfThisYear.getFullYear()}`;
    const endOfYearFormatted = `${endOfThisYear.getDate()} ${endOfThisYear.toLocaleString('default', { month: 'long' })} ${endOfThisYear.getFullYear()}`;

    const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31);
    const startOfYearFormattedYesterday = `${startOfLastYear.getDate()} ${startOfLastYear.toLocaleString('default', { month: 'long' })} ${startOfLastYear.getFullYear()}`;
    const endOfYearFormattedYesterday = `${endOfLastYear.getDate()} ${endOfLastYear.toLocaleString('default', { month: 'long' })} ${endOfLastYear.getFullYear()}`;

    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client dans la base de données
    db.query('SELECT * FROM clients WHERE id = ?', [loggedInClientId], (error, clientResults) => {
        if (error) {
            console.error(error);
            return res.render('error', { message: 'Une erreur s\'est produite lors de la récupération du profil du client' });
        }

        if (clientResults.length === 0) {
            return res.render('error', { message: 'Profil du client non trouvé' });
        }
        db.query('SELECT * FROM urls WHERE client_id = ? AND tracking_id = ?', [loggedInClientId, trackingId], (error, urlResultsAll) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }
            // Fonction pour éviter la répétition de la récupération des données et rendre le code plus lisible
            const fetchData = (sqlQuery, queryParams, callback) => {
                db.query(sqlQuery, queryParams, (error, results) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).render('error', { message: 'Une erreur s\'est produite lors de la récupération des données pour le rapport.' });
                    }
                    callback(results);
                });
            };

            // Fonction pour formater la durée au format heures:minutes:secondes
            const formatDuration = (durationInSeconds) => {
                const hours = Math.floor(durationInSeconds / 3600);
                const minutes = Math.floor((durationInSeconds % 3600) / 60);
                const seconds = durationInSeconds % 60;
                return `${hours}:${minutes}:${seconds}`;
            };

            fetchData(`
            SELECT
                COUNT(DISTINCT page) AS nombre_pages_visitees_semaine
            FROM
                interactions
            WHERE
                event = 'visit'
                AND tracking_id = ?
                AND timestamp >= ?
                AND timestamp < ?
        `, [trackingId, startOfThisWeek, endOfThisWeek], (pageWeekResults) => {
                const nombrePagesVisiteesSemaine = pageWeekResults[0].nombre_pages_visitees_semaine;

                fetchData(`
                SELECT
                    COUNT(*) AS nombre_visiteurs_semaine
                FROM
                    interactions
                WHERE
                    event = 'visit'
                    AND tracking_id = ?
                    AND timestamp >= ?
                    AND timestamp < ?
            `, [trackingId, startOfThisWeek, endOfThisWeek], (visitorWeekResults) => {
                    const nombreVisiteursSemaine = visitorWeekResults[0].nombre_visiteurs_semaine;

                    fetchData(`
                    SELECT
                        COUNT(DISTINCT page) AS nombre_pages_visitees_aujourdhui
                    FROM
                        interactions
                    WHERE
                        event = 'visit'
                        AND tracking_id = ?
                        AND timestamp >= ?
                        AND timestamp < ?
                `, [trackingId, startOfToday, endOfToday], (pageTodayResults) => {
                        const nombrePagesVisiteesAujourdhui = pageTodayResults[0].nombre_pages_visitees_aujourdhui;

                        fetchData(`
                        SELECT
                            COUNT(*) AS nombre_visiteurs_aujourdhui
                        FROM
                            interactions
                        WHERE
                            event = 'visit'
                            AND tracking_id = ?
                            AND timestamp >= ?
                            AND timestamp < ?
                    `, [trackingId, startOfToday, endOfToday], (visitorTodayResults) => {
                            const nombreVisiteursAujourdhui = visitorTodayResults[0].nombre_visiteurs_aujourdhui;

                            fetchData(`
                            SELECT
                                COUNT(DISTINCT page) AS nombre_pages_visitees_ce_mois
                            FROM
                                interactions
                            WHERE
                                event = 'visit'
                                AND tracking_id = ?
                                AND timestamp >= ?
                                AND timestamp < ?
                        `, [trackingId, startOfThisMonth, endOfThisMonth], (pageMonthResults) => {
                                const nombrePagesVisiteesCeMois = pageMonthResults[0].nombre_pages_visitees_ce_mois;

                                fetchData(`
                                SELECT
                                    COUNT(*) AS nombre_visiteurs_ce_mois
                                FROM
                                    interactions
                                WHERE
                                    event = 'visit'
                                    AND tracking_id = ?
                                    AND timestamp >= ?
                                    AND timestamp < ?
                            `, [trackingId, startOfThisMonth, endOfThisMonth], (visitorMonthResults) => {
                                    const nombreVisiteursCeMois = visitorMonthResults[0].nombre_visiteurs_ce_mois;

                                    fetchData(`
                                    SELECT
                                        SUM(duration) AS total_duree_aujourdhui
                                    FROM
                                        interactions
                                    WHERE
                                        event = 'visit'
                                        AND tracking_id = ?
                                        AND timestamp >= ?
                                        AND timestamp < ?
                                `, [trackingId, startOfToday, endOfToday], (durationTodayResults) => {
                                        const totalDurationAujourdhui = formatDuration(durationTodayResults[0].total_duree_aujourdhui);

                                        fetchData(`
                                        SELECT
                                            SUM(duration) AS total_duree_semaine
                                        FROM
                                            interactions
                                        WHERE
                                            event = 'visit'
                                            AND tracking_id = ?
                                            AND timestamp >= ?
                                            AND timestamp < ?
                                    `, [trackingId, startOfThisWeek, endOfThisWeek], (durationWeekResults) => {
                                            const totalDurationSemaine = formatDuration(durationWeekResults[0].total_duree_semaine);

                                            fetchData(`
                                            SELECT
                                                SUM(duration) AS total_duree_annee
                                            FROM
                                                interactions
                                            WHERE
                                                event = 'visit'
                                                AND tracking_id = ?
                                                AND timestamp >= ?
                                                AND timestamp < ?
                                        `, [trackingId, startOfThisYear, endOfThisYear], (durationYearResults) => {
                                                const totalDurationAnnee = formatDuration(durationYearResults[0].total_duree_annee);

                                                fetchData(`
                                                SELECT
                                                    SUM(duration) AS total_duree_ce_mois
                                                FROM
                                                    interactions
                                                WHERE
                                                    event = 'visit'
                                                    AND tracking_id = ?
                                                    AND timestamp >= ?
                                                    AND timestamp < ?
                                            `, [trackingId, startOfThisMonth, endOfThisMonth], (durationMonthResults) => {
                                                    const totalDurationCeMois = formatDuration(durationMonthResults[0].total_duree_ce_mois);

                                                    fetchData(`
                                                    SELECT
                                                        COUNT(DISTINCT userAgent) AS nombre_user_agents_aujourdhui
                                                    FROM
                                                        interactions
                                                    WHERE
                                                        tracking_id = ?
                                                        AND timestamp >= ?
                                                        AND timestamp < ?
                                                `, [trackingId, startOfToday, endOfToday], (userAgentTodayResults) => {
                                                        const nombreUserAgentsAujourdhui = userAgentTodayResults[0].nombre_user_agents_aujourdhui;

                                                        fetchData(`
                                                        SELECT
                                                            COUNT(DISTINCT userAgent) AS nombre_user_agents_semaine
                                                        FROM
                                                            interactions
                                                        WHERE
                                                            tracking_id = ?
                                                            AND timestamp >= ?
                                                            AND timestamp < ?
                                                    `, [trackingId, startOfThisWeek, endOfThisWeek], (userAgentWeekResults) => {
                                                            const nombreUserAgentsSemaine = userAgentWeekResults[0].nombre_user_agents_semaine;

                                                            fetchData(`
                                                            SELECT
                                                                COUNT(DISTINCT userAgent) AS nombre_user_agents_mois
                                                            FROM
                                                                interactions
                                                            WHERE
                                                                tracking_id = ?
                                                                AND timestamp >= ?
                                                                AND timestamp < ?
                                                        `, [trackingId, startOfThisMonth, endOfThisMonth], (userAgentMonthResults) => {
                                                                const nombreUserAgentsMois = userAgentMonthResults[0].nombre_user_agents_mois;

                                                                fetchData(`
                                                                SELECT
                                                                    COUNT(DISTINCT userAgent) AS nombre_user_agents_annee
                                                                FROM
                                                                    interactions
                                                                WHERE
                                                                    tracking_id = ?
                                                                    AND timestamp >= ?
                                                                    AND timestamp < ?
                                                            `, [trackingId, startOfThisYear, endOfThisYear], (userAgentYearResults) => {
                                                                    const nombreUserAgentsAnnee = userAgentYearResults[0].nombre_user_agents_annee;

                                                                    fetchData(`
                                                                    SELECT
                                                                        COUNT(*) AS nombre_clicks_aujourdhui
                                                                    FROM
                                                                        interactions
                                                                    WHERE
                                                                        event = 'click'
                                                                        AND tracking_id = ?
                                                                        AND timestamp >= ?
                                                                        AND timestamp < ?
                                                                `, [trackingId, startOfToday, endOfToday], (clickTodayResults) => {
                                                                        const nombreClicksAujourdhui = clickTodayResults[0].nombre_clicks_aujourdhui;

                                                                        fetchData(`
                                                                        SELECT
                                                                            COUNT(*) AS nombre_clicks_semaine
                                                                        FROM
                                                                            interactions
                                                                        WHERE
                                                                            event = 'click'
                                                                            AND tracking_id = ?
                                                                            AND timestamp >= ?
                                                                            AND timestamp < ?
                                                                    `, [trackingId, startOfThisWeek, endOfThisWeek], (clickWeekResults) => {
                                                                            const nombreClicksSemaine = clickWeekResults[0].nombre_clicks_semaine;

                                                                            fetchData(`
                                                                            SELECT
                                                                                COUNT(*) AS nombre_clicks_ce_mois
                                                                            FROM
                                                                                interactions
                                                                            WHERE
                                                                                event = 'click'
                                                                                AND tracking_id = ?
                                                                                AND timestamp >= ?
                                                                                AND timestamp < ?
                                                                        `, [trackingId, startOfThisMonth, endOfThisMonth], (clickMonthResults) => {
                                                                                const nombreClicksCeMois = clickMonthResults[0].nombre_clicks_ce_mois;

                                                                                fetchData(`
                                                                                SELECT
                                                                                    COUNT(*) AS nombre_clicks_annee
                                                                                FROM
                                                                                    interactions
                                                                                WHERE
                                                                                    event = 'click'
                                                                                    AND tracking_id = ?
                                                                                    AND timestamp >= ?
                                                                                    AND timestamp < ?
                                                                            `, [trackingId, startOfThisYear, endOfThisYear], (clickYearResults) => {
                                                                                    const nombreClicksAnnee = clickYearResults[0].nombre_clicks_annee;

                                                                                    fetchData(`
                                                                                    SELECT
                                                                                        COUNT(DISTINCT page) AS nombre_pages_visitees_annee
                                                                                    FROM
                                                                                        interactions
                                                                                    WHERE
                                                                                        event = 'visit'
                                                                                        AND tracking_id = ?
                                                                                        AND timestamp >= ?
                                                                                        AND timestamp < ?
                                                                                `, [trackingId, startOfThisYear, endOfThisYear], (pageYearResults) => {
                                                                                        const nombrePagesVisiteesAnnee = pageYearResults[0].nombre_pages_visitees_annee;

                                                                                        fetchData(`
                                                                                        SELECT
                                                                                            COUNT(*) AS nombre_visiteurs_annee
                                                                                        FROM
                                                                                            interactions
                                                                                        WHERE
                                                                                            event = 'visit'
                                                                                            AND tracking_id = ?
                                                                                            AND timestamp >= ?
                                                                                            AND timestamp < ?
                                                                                    `, [trackingId, startOfThisYear, endOfThisYear], (visitorYearResults) => {
                                                                                            const nombreVisiteursAnnee = visitorYearResults[0].nombre_visiteurs_annee;

                                                                                            // Calcul des différences avec les périodes précédentes
                                                                                            fetchData(`
                                                                                            SELECT
                                                                                                COUNT(DISTINCT page) AS nombre_pages_visitees_jour_precedent
                                                                                            FROM
                                                                                                interactions
                                                                                            WHERE
                                                                                                event = 'visit'
                                                                                                AND tracking_id = ?
                                                                                                AND timestamp >= ?
                                                                                                AND timestamp < ?
                                                                                        `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (pageYesterdayResults) => {
                                                                                                const nombrePagesVisiteesJourPrecedent = pageYesterdayResults[0].nombre_pages_visitees_jour_precedent;
                                                                                                const differencePagesVisiteesJour = nombrePagesVisiteesAujourdhui - nombrePagesVisiteesJourPrecedent;
                                                                                                let messageDifferencePagesVisiteesJour;
                                                                                                let differenceAbsoluePagesVisiteesJour;

                                                                                                if (differencePagesVisiteesJour > 0) {
                                                                                                    messageDifferencePagesVisiteesJour = 'Augmenter';
                                                                                                    differenceAbsoluePagesVisiteesJour = differencePagesVisiteesJour;
                                                                                                } else if (differencePagesVisiteesJour < 0) {
                                                                                                    messageDifferencePagesVisiteesJour = 'Diminuer';
                                                                                                } else {
                                                                                                    // Dans le cas où la différence est égale à zéro
                                                                                                    messageDifferencePagesVisiteesJour = 'Inchangé';
                                                                                                    differenceAbsoluePagesVisiteesJour = 0;
                                                                                                }

                                                                                                fetchData(`
                                                                                                SELECT
                                                                                                    COUNT(*) AS nombre_visiteurs_jour_precedent
                                                                                                FROM
                                                                                                    interactions
                                                                                                WHERE
                                                                                                    event = 'visit'
                                                                                                    AND tracking_id = ?
                                                                                                    AND timestamp >= ?
                                                                                                    AND timestamp < ?
                                                                                            `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (visitorYesterdayResults) => {
                                                                                                    const nombreVisiteursJourPrecedent = visitorYesterdayResults[0].nombre_visiteurs_jour_precedent;
                                                                                                    const differenceVisiteursJour = nombreVisiteursAujourdhui - nombreVisiteursJourPrecedent;
                                                                                                    let messageDifferenceVisiteursJour;
                                                                                                    let differenceAbsolueVisiteursJour;

                                                                                                    if (differenceVisiteursJour > 0) {
                                                                                                        messageDifferenceVisiteursJour = 'Augmenter';
                                                                                                        differenceAbsolueVisiteursJour = differenceVisiteursJour;
                                                                                                    } else if (differenceVisiteursJour < 0) {
                                                                                                        messageDifferenceVisiteursJour = 'Diminuer';
                                                                                                    } else {
                                                                                                        // Dans le cas où la différence est égale à zéro
                                                                                                        messageDifferenceVisiteursJour = 'Inchangé';
                                                                                                        differenceAbsolueVisiteursJour = 0;
                                                                                                    }


                                                                                                    fetchData(`
                                                                                                    SELECT
                                                                                                        SUM(duration) AS total_duree_jour_precedent
                                                                                                    FROM
                                                                                                        interactions
                                                                                                    WHERE
                                                                                                        event = 'visit'
                                                                                                        AND tracking_id = ?
                                                                                                        AND timestamp >= ?
                                                                                                        AND timestamp < ?
                                                                                                `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (durationYesterdayResults) => {
                                                                                                        const totalDurationJourPrecedent = formatDuration(durationYesterdayResults[0].total_duree_jour_precedent);
                                                                                                        const totalDurationJourPrecedentInSeconds = durationYesterdayResults[0].total_duree_jour_precedent;
                                                                                                        const totalDurationAujourdhuiInSeconds = durationTodayResults[0].total_duree_aujourdhui;

                                                                                                        const differenceDurationJour = totalDurationAujourdhuiInSeconds - totalDurationJourPrecedentInSeconds;


                                                                                                        let messageDifferenceDurationJour;
                                                                                                        let differenceAbsolueDurationJour;

                                                                                                        if (differenceDurationJour > 0) {
                                                                                                            messageDifferenceDurationJour = 'Augmenter';
                                                                                                            differenceAbsolueDurationJour = formatDuration(differenceDurationJour);
                                                                                                        } else if (differenceDurationJour < 0) {
                                                                                                            messageDifferenceDurationJour = 'Diminuer';
                                                                                                        } else {
                                                                                                            // Dans le cas où la différence est égale à zéro
                                                                                                            messageDifferenceDurationJour = 'Inchangé';
                                                                                                            differenceAbsolueDurationJour = '00:00:00';
                                                                                                        }

                                                                                                        fetchData(`
                                                                                                        SELECT
                                                                                                            COUNT(DISTINCT userAgent) AS nombre_user_agents_jour_precedent
                                                                                                        FROM
                                                                                                            interactions
                                                                                                        WHERE
                                                                                                            tracking_id = ?
                                                                                                            AND timestamp >= ?
                                                                                                            AND timestamp < ?
                                                                                                    `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (userAgentYesterdayResults) => {
                                                                                                            const nombreUserAgentsJourPrecedent = userAgentYesterdayResults[0].nombre_user_agents_jour_precedent;
                                                                                                            const differenceUserAgentsJour = nombreUserAgentsAujourdhui - nombreUserAgentsJourPrecedent;
                                                                                                            let messageDifferenceUserAgentsJour;
                                                                                                            let differenceAbsolueUserAgentsJour;

                                                                                                            if (differenceVisiteursJour > 0) {
                                                                                                                messageDifferenceUserAgentsJour = 'Augmenter';
                                                                                                                differenceAbsolueUserAgentsJour = differenceUserAgentsJour;
                                                                                                            } else if (differenceUserAgentsJour < 0) {
                                                                                                                messageDifferenceUserAgentsJour = 'Diminuer';
                                                                                                            } else {
                                                                                                                // Dans le cas où la différence est égale à zéro
                                                                                                                messageDifferenceUserAgentsJour = 'Inchangé';
                                                                                                                differenceAbsolueUserAgentsJour = 0;
                                                                                                            }

                                                                                                            fetchData(`
                                                                                                            SELECT
                                                                                                                COUNT(*) AS nombre_clicks_jour_precedent
                                                                                                            FROM
                                                                                                                interactions
                                                                                                            WHERE
                                                                                                                event = 'click'
                                                                                                                AND tracking_id = ?
                                                                                                                AND timestamp >= ?
                                                                                                                AND timestamp < ?
                                                                                                        `, [trackingId, new Date(startOfToday.getTime() - (24 * 60 * 60 * 1000)), startOfToday], (clickYesterdayResults) => {
                                                                                                                const nombreClicksJourPrecedent = clickYesterdayResults[0].nombre_clicks_jour_precedent;
                                                                                                                const differenceClicksJour = nombreClicksAujourdhui - nombreClicksJourPrecedent;
                                                                                                                let messageDifferenceClicksJour;
                                                                                                                let differenceAbsolueClicksJour;

                                                                                                                if (differenceClicksJour > 0) {
                                                                                                                    messageDifferenceClicksJour = 'Augmenter';
                                                                                                                    differenceAbsolueClicksJour = differenceClicksJour;
                                                                                                                } else if (differenceClicksJour < 0) {
                                                                                                                    messageDifferenceClicksJour = 'Diminuer';
                                                                                                                } else {
                                                                                                                    // Dans le cas où la différence est égale à zéro
                                                                                                                    messageDifferenceClicksJour = 'Inchangé';
                                                                                                                    differenceAbsolueClicksJour = 0;
                                                                                                                }

                                                                                                                fetchData(`
                                                                                                                SELECT
                                                                                                                    COUNT(DISTINCT page) AS nombre_pages_visitees_semaine_precedente
                                                                                                                FROM
                                                                                                                    interactions
                                                                                                                WHERE
                                                                                                                    event = 'visit'
                                                                                                                    AND tracking_id = ?
                                                                                                                    AND timestamp >= ?
                                                                                                                    AND timestamp < ?
                                                                                                            `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (pageLastWeekResults) => {
                                                                                                                    const nombrePagesVisiteesSemainePrecedente = pageLastWeekResults[0].nombre_pages_visitees_semaine_precedente;
                                                                                                                    const differencePagesVisiteesSemaine = nombrePagesVisiteesSemaine - nombrePagesVisiteesSemainePrecedente;
                                                                                                                    let messageDifferencePagesVisiteesSemaine;
                                                                                                                    let differenceAbsoluePagesVisiteesSemaine;

                                                                                                                    if (differencePagesVisiteesSemaine > 0) {
                                                                                                                        messageDifferencePagesVisiteesSemaine = 'Augmenter';
                                                                                                                        differenceAbsoluePagesVisiteesSemaine = differencePagesVisiteesSemaine;
                                                                                                                    } else if (differencePagesVisiteesSemaine < 0) {
                                                                                                                        messageDifferencePagesVisiteesSemaine = 'Diminuer';
                                                                                                                    } else {
                                                                                                                        // Dans le cas où la différence est égale à zéro
                                                                                                                        messageDifferencePagesVisiteesSemaine = 'Inchangé';
                                                                                                                        differenceAbsoluePagesVisiteesSemaine = 0;
                                                                                                                    }

                                                                                                                    fetchData(`
                                                                                                                    SELECT
                                                                                                                        COUNT(*) AS nombre_visiteurs_semaine_precedente
                                                                                                                    FROM
                                                                                                                        interactions
                                                                                                                    WHERE
                                                                                                                        event = 'visit'
                                                                                                                        AND tracking_id = ?
                                                                                                                        AND timestamp >= ?
                                                                                                                        AND timestamp < ?
                                                                                                                `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (visitorLastWeekResults) => {
                                                                                                                        const nombreVisiteursSemainePrecedente = visitorLastWeekResults[0].nombre_visiteurs_semaine_precedente;
                                                                                                                        const differenceVisiteursSemaine = nombreVisiteursSemaine - nombreVisiteursSemainePrecedente;
                                                                                                                        let messageDifferenceVisiteursSemaine;
                                                                                                                        let differenceAbsolueVisiteursSemaine;

                                                                                                                        if (differenceVisiteursSemaine > 0) {
                                                                                                                            messageDifferenceVisiteursSemaine = 'Augmenter';
                                                                                                                            differenceAbsolueVisiteursSemaine = differenceVisiteursSemaine;
                                                                                                                        } else if (differenceVisiteursSemaine < 0) {
                                                                                                                            messageDifferenceVisiteursSemaine = 'Diminuer';
                                                                                                                        } else {
                                                                                                                            // Dans le cas où la différence est égale à zéro
                                                                                                                            messageDifferenceVisiteursSemaine = 'Inchangé';
                                                                                                                            differenceAbsolueVisiteursSemaine = 0;
                                                                                                                        }

                                                                                                                        fetchData(`
                                                                                                                        SELECT
                                                                                                                            SUM(duration) AS total_duree_semaine_precedente
                                                                                                                        FROM
                                                                                                                            interactions
                                                                                                                        WHERE
                                                                                                                            event = 'visit'
                                                                                                                            AND tracking_id = ?
                                                                                                                            AND timestamp >= ?
                                                                                                                            AND timestamp < ?
                                                                                                                    `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (durationLastWeekResults) => {
                                                                                                                            const totalDurationSemainePrecedente = formatDuration(durationLastWeekResults[0].total_duree_semaine_precedente);
                                                                                                                            const totalDurationSemainePrecedentInSeconds = durationLastWeekResults[0].total_duree_semaine_precedente;
                                                                                                                            const totalDurationSemaineInSeconds = durationWeekResults[0].total_duree_semaine;


                                                                                                                            const differenceDurationSemaine = totalDurationSemaineInSeconds - totalDurationSemainePrecedentInSeconds;
                                                                                                                            let messageDifferenceDurationSemaine;
                                                                                                                            let differenceAbsolueDurationSemaine;

                                                                                                                            if (differenceDurationSemaine > 0) {
                                                                                                                                messageDifferenceDurationSemaine = 'Augmenter';
                                                                                                                                differenceAbsolueDurationSemaine = formatDuration(differenceDurationSemaine);
                                                                                                                            } else if (differenceDurationSemaine < 0) {
                                                                                                                                messageDifferenceDurationSemaine = 'Diminuer';
                                                                                                                            } else {
                                                                                                                                // Dans le cas où la différence est égale à zéro
                                                                                                                                messageDifferenceDurationSemaine = 'Inchangé';
                                                                                                                                differenceAbsolueDurationSemaine = '00:00:00';
                                                                                                                            }
                                                                                                                            fetchData(`
                                                                                                                            SELECT
                                                                                                                                COUNT(DISTINCT userAgent) AS nombre_user_agents_semaine_precedente
                                                                                                                            FROM
                                                                                                                                interactions
                                                                                                                            WHERE
                                                                                                                                tracking_id = ?
                                                                                                                                AND timestamp >= ?
                                                                                                                                AND timestamp < ?
                                                                                                                        `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (userAgentLastWeekResults) => {
                                                                                                                                const nombreUserAgentsSemainePrecedente = userAgentLastWeekResults[0].nombre_user_agents_semaine_precedente;
                                                                                                                                const differenceUserAgentsSemaine = nombreUserAgentsSemaine - nombreUserAgentsSemainePrecedente;
                                                                                                                                let messageDifferenceUserAgentsSemaine;
                                                                                                                                let differenceAbsolueUserAgentsSemaine;

                                                                                                                                if (differenceUserAgentsSemaine > 0) {
                                                                                                                                    messageDifferenceUserAgentsSemaine = 'Augmenter';
                                                                                                                                    differenceAbsolueUserAgentsSemaine = differenceUserAgentsSemaine;
                                                                                                                                } else if (differenceUserAgentsSemaine < 0) {
                                                                                                                                    messageDifferenceUserAgentsSemaine = 'Diminuer';
                                                                                                                                } else {
                                                                                                                                    // Dans le cas où la différence est égale à zéro
                                                                                                                                    messageDifferenceUserAgentsSemaine = 'Inchangé';
                                                                                                                                    differenceAbsolueUserAgentsSemaine = 0;
                                                                                                                                }

                                                                                                                                fetchData(`
                                                                                                                                SELECT
                                                                                                                                    COUNT(*) AS nombre_clicks_semaine_precedente
                                                                                                                                FROM
                                                                                                                                    interactions
                                                                                                                                WHERE
                                                                                                                                    event = 'click'
                                                                                                                                    AND tracking_id = ?
                                                                                                                                    AND timestamp >= ?
                                                                                                                                    AND timestamp < ?
                                                                                                                            `, [trackingId, new Date(startOfThisWeek.getTime() - (7 * 24 * 60 * 60 * 1000)), startOfThisWeek], (clickLastWeekResults) => {
                                                                                                                                    const nombreClicksSemainePrecedente = clickLastWeekResults[0].nombre_clicks_semaine_precedente;
                                                                                                                                    const differenceClicksSemaine = nombreClicksSemaine - nombreClicksSemainePrecedente;
                                                                                                                                    let messageDifferenceClicksSemaine;
                                                                                                                                    let differenceAbsolueClicksSemaine;

                                                                                                                                    if (differenceClicksSemaine > 0) {
                                                                                                                                        messageDifferenceClicksSemaine = 'Augmenter';
                                                                                                                                        differenceAbsolueClicksSemaine = differenceClicksSemaine;
                                                                                                                                    } else if (differenceClicksSemaine < 0) {
                                                                                                                                        messageDifferenceClicksSemaine = 'Diminuer';
                                                                                                                                    } else {
                                                                                                                                        // Dans le cas où la différence est égale à zéro
                                                                                                                                        messageDifferenceClicksSemaine = 'Inchangé';
                                                                                                                                        differenceAbsolueClicksSemaine = 0;
                                                                                                                                    }

                                                                                                                                    fetchData(`
                                                                                                                                    SELECT
                                                                                                                                        COUNT(DISTINCT page) AS nombre_pages_visitees_mois_precedent
                                                                                                                                    FROM
                                                                                                                                        interactions
                                                                                                                                    WHERE
                                                                                                                                        event = 'visit'
                                                                                                                                        AND tracking_id = ?
                                                                                                                                        AND timestamp >= ?
                                                                                                                                        AND timestamp < ?
                                                                                                                                `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (pageLastMonthResults) => {
                                                                                                                                        const nombrePagesVisiteesMoisPrecedent = pageLastMonthResults[0].nombre_pages_visitees_mois_precedent;
                                                                                                                                        const differencePagesVisiteesMois = nombrePagesVisiteesCeMois - nombrePagesVisiteesMoisPrecedent;
                                                                                                                                        let messageDifferencePagesVisiteesMois;
                                                                                                                                        let differenceAbsoluePagesVisiteesMois;

                                                                                                                                        if (differencePagesVisiteesMois > 0) {
                                                                                                                                            messageDifferencePagesVisiteesMois = 'Augmenter';
                                                                                                                                            differenceAbsoluePagesVisiteesMois = differencePagesVisiteesMois;
                                                                                                                                        } else if (differencePagesVisiteesMois < 0) {
                                                                                                                                            messageDifferencePagesVisiteesMois = 'Diminuer';
                                                                                                                                        } else {
                                                                                                                                            // Dans le cas où la différence est égale à zéro
                                                                                                                                            messageDifferencePagesVisiteesMois = 'Inchangé';
                                                                                                                                            differenceAbsoluePagesVisiteesMois = 0;
                                                                                                                                        }

                                                                                                                                        fetchData(`
                                                                                                                                        SELECT
                                                                                                                                            COUNT(*) AS nombre_visiteurs_mois_precedent
                                                                                                                                        FROM
                                                                                                                                            interactions
                                                                                                                                        WHERE
                                                                                                                                            event = 'visit'
                                                                                                                                            AND tracking_id = ?
                                                                                                                                            AND timestamp >= ?
                                                                                                                                            AND timestamp < ?
                                                                                                                                    `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (visitorLastMonthResults) => {
                                                                                                                                            const nombreVisiteursMoisPrecedent = visitorLastMonthResults[0].nombre_visiteurs_mois_precedent;
                                                                                                                                            const differenceVisiteursMois = nombreVisiteursCeMois - nombreVisiteursMoisPrecedent;
                                                                                                                                            let messageDifferenceVisiteursMois;
                                                                                                                                            let differenceAbsolueVisiteursMois;

                                                                                                                                            if (differenceVisiteursMois > 0) {
                                                                                                                                                messageDifferenceVisiteursMois = 'Augmenter';
                                                                                                                                                differenceAbsolueVisiteursMois = differenceVisiteursMois;
                                                                                                                                            } else if (differenceVisiteursMois < 0) {
                                                                                                                                                messageDifferenceVisiteursMois = 'Diminuer';
                                                                                                                                            } else {
                                                                                                                                                // Dans le cas où la différence est égale à zéro
                                                                                                                                                messageDifferenceVisiteursMois = 'Inchangé';
                                                                                                                                                differenceAbsolueVisiteursMois = 0;
                                                                                                                                            }

                                                                                                                                            fetchData(`
                                                                                                                                            SELECT
                                                                                                                                                SUM(duration) AS total_duree_mois_precedent
                                                                                                                                            FROM
                                                                                                                                                interactions
                                                                                                                                            WHERE
                                                                                                                                                event = 'visit'
                                                                                                                                                AND tracking_id = ?
                                                                                                                                                AND timestamp >= ?
                                                                                                                                                AND timestamp < ?
                                                                                                                                        `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (durationLastMonthResults) => {
                                                                                                                                                const totalDurationMoisPrecedent = formatDuration(durationLastMonthResults[0].total_duree_mois_precedent);
                                                                                                                                                const totalDurationMoisPrecedentInSeconds = durationLastMonthResults[0].total_duree_mois_precedent;
                                                                                                                                                const totalDurationMoisInSeconds = durationMonthResults[0].total_duree_ce_mois;

                                                                                                                                                const differenceDurationMois = totalDurationMoisInSeconds - totalDurationMoisPrecedentInSeconds;
                                                                                                                                                let messageDifferenceDurationMois;
                                                                                                                                                let differenceAbsolueDurationMois;

                                                                                                                                                if (differenceDurationMois > 0) {
                                                                                                                                                    messageDifferenceDurationMois = 'Augmenter';
                                                                                                                                                    differenceAbsolueDurationMois = formatDuration(differenceDurationMois);
                                                                                                                                                } else if (differenceDurationMois < 0) {
                                                                                                                                                    messageDifferenceDurationMois = 'Diminuer';
                                                                                                                                                } else {
                                                                                                                                                    // Dans le cas où la différence est égale à zéro
                                                                                                                                                    messageDifferenceDurationMois = 'Inchangé';
                                                                                                                                                    differenceAbsolueDurationMois = '00:00:00';
                                                                                                                                                }

                                                                                                                                                fetchData(`
                                                                                                                                                SELECT
                                                                                                                                                    COUNT(DISTINCT userAgent) AS nombre_user_agents_mois_precedent
                                                                                                                                                FROM
                                                                                                                                                    interactions
                                                                                                                                                WHERE
                                                                                                                                                    tracking_id = ?
                                                                                                                                                    AND timestamp >= ?
                                                                                                                                                    AND timestamp < ?
                                                                                                                                            `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (userAgentLastMonthResults) => {
                                                                                                                                                    const nombreUserAgentsMoisPrecedent = userAgentLastMonthResults[0].nombre_user_agents_mois_precedent;
                                                                                                                                                    const differenceUserAgentsMois = nombreUserAgentsMois - nombreUserAgentsMoisPrecedent;
                                                                                                                                                    let messageDifferenceUserAgentsMois;
                                                                                                                                                    let differenceAbsolueUserAgentsMois;

                                                                                                                                                    if (differenceUserAgentsMois > 0) {
                                                                                                                                                        messageDifferenceUserAgentsMois = 'Augmenter';
                                                                                                                                                        differenceAbsolueUserAgentsMois = differenceUserAgentsMois;
                                                                                                                                                    } else if (differenceUserAgentsMois < 0) {
                                                                                                                                                        messageDifferenceUserAgentsMois = 'Diminuer';
                                                                                                                                                    } else {
                                                                                                                                                        // Dans le cas où la différence est égale à zéro
                                                                                                                                                        messageDifferenceUserAgentsMois = 'Inchangé';
                                                                                                                                                        differenceAbsolueUserAgentsMois = 0;
                                                                                                                                                    }

                                                                                                                                                    fetchData(`
                                                                                                                                                    SELECT
                                                                                                                                                        COUNT(*) AS nombre_clicks_mois_precedent
                                                                                                                                                    FROM
                                                                                                                                                        interactions
                                                                                                                                                    WHERE
                                                                                                                                                        event = 'click'
                                                                                                                                                        AND tracking_id = ?
                                                                                                                                                        AND timestamp >= ?
                                                                                                                                                        AND timestamp < ?
                                                                                                                                                `, [trackingId, new Date(startOfThisMonth.getTime() - (30 * 24 * 60 * 60 * 1000)), startOfThisMonth], (clickLastMonthResults) => {
                                                                                                                                                        const nombreClicksMoisPrecedent = clickLastMonthResults[0].nombre_clicks_mois_precedent;
                                                                                                                                                        const differenceClicksMois = nombreClicksCeMois - nombreClicksMoisPrecedent;
                                                                                                                                                        let messageDifferenceClicksMois;
                                                                                                                                                        let differenceAbsolueClicksMois;

                                                                                                                                                        if (differenceClicksMois > 0) {
                                                                                                                                                            messageDifferenceClicksMois = 'Augmenter';
                                                                                                                                                            differenceAbsolueClicksMois = differenceClicksMois;
                                                                                                                                                        } else if (differenceClicksMois < 0) {
                                                                                                                                                            messageDifferenceClicksMois = 'Diminuer';
                                                                                                                                                        } else {
                                                                                                                                                            // Dans le cas où la différence est égale à zéro
                                                                                                                                                            messageDifferenceClicksMois = 'Inchangé';
                                                                                                                                                            differenceAbsolueClicksMois = 0;
                                                                                                                                                        }

                                                                                                                                                        fetchData(`
                                                                                                                                                        SELECT
                                                                                                                                                            COUNT(DISTINCT page) AS nombre_pages_visitees_annee_precedente
                                                                                                                                                        FROM
                                                                                                                                                            interactions
                                                                                                                                                        WHERE
                                                                                                                                                            event = 'visit'
                                                                                                                                                            AND tracking_id = ?
                                                                                                                                                            AND timestamp >= ?
                                                                                                                                                            AND timestamp < ?
                                                                                                                                                    `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (pageLastYearResults) => {
                                                                                                                                                            const nombrePagesVisiteesAnneePrecedente = pageLastYearResults[0].nombre_pages_visitees_annee_precedente;
                                                                                                                                                            const differencePagesVisiteesAnnee = nombrePagesVisiteesAnnee - nombrePagesVisiteesAnneePrecedente;
                                                                                                                                                            let messageDifferencePagesVisiteesAnnee;
                                                                                                                                                            let differenceAbsoluePagesVisiteesAnnee;

                                                                                                                                                            if (differencePagesVisiteesAnnee > 0) {
                                                                                                                                                                messageDifferencePagesVisiteesAnnee = 'Augmenter';
                                                                                                                                                                differenceAbsoluePagesVisiteesAnnee = differencePagesVisiteesAnnee;
                                                                                                                                                            } else if (differencePagesVisiteesAnnee < 0) {
                                                                                                                                                                messageDifferencePagesVisiteesAnnee = 'Diminuer';
                                                                                                                                                            } else {
                                                                                                                                                                // Dans le cas où la différence est égale à zéro
                                                                                                                                                                messageDifferencePagesVisiteesAnnee = 'Inchangé';
                                                                                                                                                                differenceAbsoluePagesVisiteesAnnee = 0;
                                                                                                                                                            }

                                                                                                                                                            fetchData(`
                                                                                                                                                            SELECT
                                                                                                                                                                COUNT(*) AS nombre_visiteurs_annee_precedente
                                                                                                                                                            FROM
                                                                                                                                                                interactions
                                                                                                                                                            WHERE
                                                                                                                                                                event = 'visit'
                                                                                                                                                                AND tracking_id = ?
                                                                                                                                                                AND timestamp >= ?
                                                                                                                                                                AND timestamp < ?
                                                                                                                                                        `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (visitorLastYearResults) => {
                                                                                                                                                                const nombreVisiteursAnneePrecedente = visitorLastYearResults[0].nombre_visiteurs_annee_precedente;
                                                                                                                                                                const differenceVisiteursAnnee = nombreVisiteursAnnee - nombreVisiteursAnneePrecedente;
                                                                                                                                                                let messageDifferenceVisiteursAnnee;
                                                                                                                                                                let differenceAbsolueVisiteursAnnee;

                                                                                                                                                                if (differenceVisiteursAnnee > 0) {
                                                                                                                                                                    messageDifferenceVisiteursAnnee = 'Augmenter';
                                                                                                                                                                    differenceAbsolueVisiteursAnnee = differenceVisiteursAnnee;
                                                                                                                                                                } else if (differenceVisiteursAnnee < 0) {
                                                                                                                                                                    messageDifferenceVisiteursAnnee = 'Diminuer';
                                                                                                                                                                } else {
                                                                                                                                                                    // Dans le cas où la différence est égale à zéro
                                                                                                                                                                    messageDifferenceVisiteursAnnee = 'Inchangé';
                                                                                                                                                                    differenceAbsolueVisiteursAnnee = 0;
                                                                                                                                                                }

                                                                                                                                                                fetchData(`
                                                                                                                                                                SELECT
                                                                                                                                                                    SUM(duration) AS total_duree_annee_precedente
                                                                                                                                                                FROM
                                                                                                                                                                    interactions
                                                                                                                                                                WHERE
                                                                                                                                                                    event = 'visit'
                                                                                                                                                                    AND tracking_id = ?
                                                                                                                                                                    AND timestamp >= ?
                                                                                                                                                                    AND timestamp < ?
                                                                                                                                                            `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (durationLastYearResults) => {
                                                                                                                                                                    const totalDurationAnneePrecedente = formatDuration(durationLastYearResults[0].total_duree_annee_precedente);
                                                                                                                                                                    const totalDurationAnneePrecedentInSeconds = durationLastYearResults[0].total_duree_annee_precedente;
                                                                                                                                                                    const totalDurationAnneeInSeconds = durationYearResults[0].total_duree_annee;

                                                                                                                                                                    const differenceDurationAnnee = totalDurationAnneeInSeconds - totalDurationAnneePrecedentInSeconds;
                                                                                                                                                                    let messageDifferenceDurationAnnee;
                                                                                                                                                                    let differenceAbsolueDurationAnnee;

                                                                                                                                                                    if (differenceDurationAnnee > 0) {
                                                                                                                                                                        messageDifferenceDurationAnnee = 'Augmenter';
                                                                                                                                                                        differenceAbsolueDurationAnnee = formatDuration(differenceDurationAnnee);
                                                                                                                                                                    } else if (differenceDurationAnnee < 0) {
                                                                                                                                                                        messageDifferenceDurationAnnee = 'Diminuer';
                                                                                                                                                                    } else {
                                                                                                                                                                        // Dans le cas où la différence est égale à zéro
                                                                                                                                                                        messageDifferenceDurationAnnee = 'Inchangé';
                                                                                                                                                                        differenceAbsolueDurationAnnee = '00:00:00';
                                                                                                                                                                    }

                                                                                                                                                                    fetchData(`
                                                                                                                                                                    SELECT
                                                                                                                                                                        COUNT(DISTINCT userAgent) AS nombre_user_agents_annee_precedente
                                                                                                                                                                    FROM
                                                                                                                                                                        interactions
                                                                                                                                                                    WHERE
                                                                                                                                                                        tracking_id = ?
                                                                                                                                                                        AND timestamp >= ?
                                                                                                                                                                        AND timestamp < ?
                                                                                                                                                                `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (userAgentLastYearResults) => {
                                                                                                                                                                        const nombreUserAgentsAnneePrecedente = userAgentLastYearResults[0].nombre_user_agents_annee_precedente;
                                                                                                                                                                        const differenceUserAgentsAnnee = nombreUserAgentsAnnee - nombreUserAgentsAnneePrecedente;
                                                                                                                                                                        let messageDifferenceUserAgentsAnnee;
                                                                                                                                                                        let differenceAbsolueUserAgentsAnnee;

                                                                                                                                                                        if (differenceUserAgentsAnnee > 0) {
                                                                                                                                                                            messageDifferenceUserAgentsAnnee = 'Augmenter';
                                                                                                                                                                            differenceAbsolueUserAgentsAnnee = differenceUserAgentsAnnee;
                                                                                                                                                                        } else if (differenceUserAgentsAnnee < 0) {
                                                                                                                                                                            messageDifferenceUserAgentsAnnee = 'Diminuer';
                                                                                                                                                                        } else {
                                                                                                                                                                            // Dans le cas où la différence est égale à zéro
                                                                                                                                                                            messageDifferenceUserAgentsAnnee = 'Inchangé';
                                                                                                                                                                            differenceAbsolueUserAgentsAnnee = 0;
                                                                                                                                                                        }

                                                                                                                                                                        fetchData(`
                                                                                                                                                                        SELECT
                                                                                                                                                                            COUNT(*) AS nombre_clicks_annee_precedente
                                                                                                                                                                        FROM
                                                                                                                                                                            interactions
                                                                                                                                                                        WHERE
                                                                                                                                                                            event = 'click'
                                                                                                                                                                            AND tracking_id = ?
                                                                                                                                                                            AND timestamp >= ?
                                                                                                                                                                            AND timestamp < ?
                                                                                                                                                                    `, [trackingId, new Date(startOfThisYear.getTime() - (365 * 24 * 60 * 60 * 1000)), startOfThisYear], (clickLastYearResults) => {
                                                                                                                                                                            const nombreClicksAnneePrecedente = clickLastYearResults[0].nombre_clicks_annee_precedente;
                                                                                                                                                                            const differenceClicksAnnee = nombreClicksAnnee - nombreClicksAnneePrecedente;
                                                                                                                                                                            let messageDifferenceClicksAnnee;
                                                                                                                                                                            let differenceAbsolueClicksAnnee;

                                                                                                                                                                            if (differenceClicksAnnee > 0) {
                                                                                                                                                                                messageDifferenceClicksAnnee = 'Augmenter';
                                                                                                                                                                                differenceAbsolueClicksAnnee = differenceClicksAnnee;
                                                                                                                                                                            } else if (differenceClicksAnnee < 0) {
                                                                                                                                                                                messageDifferenceClicksAnnee = 'Diminuer';
                                                                                                                                                                            } else {
                                                                                                                                                                                // Dans le cas où la différence est égale à zéro
                                                                                                                                                                                messageDifferenceClicksAnnee = 'Inchangé';
                                                                                                                                                                                differenceAbsolueClicksAnnee = 0;
                                                                                                                                                                            }

                                                                                                                                                                            res.render('rapport', {
                                                                                                                                                                                client: clientResults[0],
                                                                                                                                                                                urls: urlResultsAll,
                                                                                                                                                                                today: formattedDate,
                                                                                                                                                                                yesterday: formattedDateYesterday,

                                                                                                                                                                                startOfWeek: startOfWeekFormatted,
                                                                                                                                                                                endOfWeek: endOfWeekFormatted,

                                                                                                                                                                                startOfLastWeek: startOfWeekFormattedYesterday,
                                                                                                                                                                                endOfLastWeek: endOfWeekFormattedYesterday,

                                                                                                                                                                                startOfMonth: startOfMonthFormatted,
                                                                                                                                                                                endOfMonth: endOfMonthFormatted,

                                                                                                                                                                                startOfLastMonth: startOfMonthFormattedYesterday,
                                                                                                                                                                                endOfLastMonth: endOfMonthFormattedYesterday,

                                                                                                                                                                                startOfYear: startOfYearFormatted,
                                                                                                                                                                                endOfYear: endOfYearFormatted,

                                                                                                                                                                                startOfLastYear: startOfYearFormattedYesterday,
                                                                                                                                                                                endOfLastYear: endOfYearFormattedYesterday,

                                                                                                                                                                                nombreUserAgentsAujourdhui,
                                                                                                                                                                                nombreUserAgentsSemaine,
                                                                                                                                                                                nombreUserAgentsMois,
                                                                                                                                                                                nombreUserAgentsAnnee,

                                                                                                                                                                                nombreVisiteursAujourdhui,
                                                                                                                                                                                nombreVisiteursSemaine,
                                                                                                                                                                                nombreVisiteursCeMois,
                                                                                                                                                                                nombreVisiteursAnnee,

                                                                                                                                                                                nombrePagesVisiteesAujourdhui,
                                                                                                                                                                                nombrePagesVisiteesSemaine,
                                                                                                                                                                                nombrePagesVisiteesCeMois,
                                                                                                                                                                                nombrePagesVisiteesAnnee,

                                                                                                                                                                                totalDurationAujourdhui,
                                                                                                                                                                                totalDurationSemaine,
                                                                                                                                                                                totalDurationAnnee,
                                                                                                                                                                                totalDurationCeMois,

                                                                                                                                                                                nombreClicksAujourdhui,
                                                                                                                                                                                nombreClicksSemaine,
                                                                                                                                                                                nombreClicksCeMois,
                                                                                                                                                                                nombreClicksAnnee,

                                                                                                                                                                                nombreVisiteursJourPrecedent,
                                                                                                                                                                                nombreVisiteursSemainePrecedente,
                                                                                                                                                                                nombreVisiteursMoisPrecedent,
                                                                                                                                                                                nombreVisiteursAnneePrecedente,

                                                                                                                                                                                nombrePagesVisiteesJourPrecedent,
                                                                                                                                                                                nombrePagesVisiteesSemainePrecedente,
                                                                                                                                                                                nombrePagesVisiteesMoisPrecedent,
                                                                                                                                                                                nombrePagesVisiteesAnneePrecedente,

                                                                                                                                                                                nombreUserAgentsJourPrecedent,
                                                                                                                                                                                nombreUserAgentsSemainePrecedente,
                                                                                                                                                                                nombreUserAgentsMoisPrecedent,
                                                                                                                                                                                nombreUserAgentsAnneePrecedente,

                                                                                                                                                                                totalDurationJourPrecedent,
                                                                                                                                                                                totalDurationSemainePrecedente,
                                                                                                                                                                                totalDurationMoisPrecedent,
                                                                                                                                                                                totalDurationAnneePrecedente,

                                                                                                                                                                                nombreClicksJourPrecedent,
                                                                                                                                                                                nombreClicksSemainePrecedente,
                                                                                                                                                                                nombreClicksMoisPrecedent,
                                                                                                                                                                                nombreClicksAnneePrecedente,
                                                                                                                                                                                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                                                                                differenceAbsolueVisiteursJour,
                                                                                                                                                                                messageVisiteursJour: `${messageDifferenceVisiteursJour}`,

                                                                                                                                                                                differenceAbsoluePagesVisiteesJour,
                                                                                                                                                                                messagePagesVisiteesJour: `${messageDifferencePagesVisiteesJour}`,

                                                                                                                                                                                differenceAbsolueDurationJour,
                                                                                                                                                                                messageDurationJour: `${messageDifferenceDurationJour}`,

                                                                                                                                                                                differenceAbsolueUserAgentsJour,
                                                                                                                                                                                messageUserAgentsJour: `${messageDifferenceUserAgentsJour}`,

                                                                                                                                                                                differenceAbsolueClicksJour,
                                                                                                                                                                                messageClicksJour: `${messageDifferenceClicksJour}`,
                                                                                                                                                                                /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                                                                                differenceAbsoluePagesVisiteesSemaine,
                                                                                                                                                                                messagePagesVisiteesSemaine: `${messageDifferencePagesVisiteesSemaine}`,

                                                                                                                                                                                differenceAbsolueVisiteursSemaine,
                                                                                                                                                                                messageVisiteursSemaine: `${messageDifferenceVisiteursSemaine}`,

                                                                                                                                                                                differenceAbsolueDurationSemaine,
                                                                                                                                                                                messageDurationSemaine: `${messageDifferenceDurationSemaine}`,

                                                                                                                                                                                differenceAbsolueUserAgentsSemaine,
                                                                                                                                                                                messageUserAgentsSemaine: `${messageDifferenceUserAgentsSemaine}`,

                                                                                                                                                                                differenceAbsolueClicksSemaine,
                                                                                                                                                                                messageClicksSemaine: `${messageDifferenceClicksSemaine}`,

                                                                                                                                                                                differenceAbsoluePagesVisiteesMois,
                                                                                                                                                                                messagePagesVisiteesMois: `${messageDifferencePagesVisiteesMois}`,

                                                                                                                                                                                differenceAbsolueVisiteursMois,
                                                                                                                                                                                messageVisiteursMois: `${messageDifferenceVisiteursMois}`,

                                                                                                                                                                                differenceAbsolueUserAgentsMois,
                                                                                                                                                                                messageUserAgentsMois: `${messageDifferenceUserAgentsMois}`,

                                                                                                                                                                                differenceAbsolueDurationMois,
                                                                                                                                                                                messageDurationMois: `${messageDifferenceDurationMois}`,

                                                                                                                                                                                differenceAbsolueUserAgentsMois,
                                                                                                                                                                                messageUserAgentsMois: `${messageDifferenceUserAgentsMois}`,

                                                                                                                                                                                differenceAbsolueClicksMois,
                                                                                                                                                                                messageClicksMois: `${messageDifferenceClicksMois}`,

                                                                                                                                                                                differenceAbsoluePagesVisiteesAnnee,
                                                                                                                                                                                messagePagesVisiteesAnnee: `${messageDifferencePagesVisiteesAnnee}`,

                                                                                                                                                                                differenceAbsolueVisiteursAnnee,
                                                                                                                                                                                messageVisiteursAnnee: `${messageDifferenceVisiteursAnnee}`,

                                                                                                                                                                                differenceAbsolueDurationAnnee,
                                                                                                                                                                                messageDurationAnnee: `${messageDifferenceDurationAnnee}`,

                                                                                                                                                                                differenceAbsolueUserAgentsAnnee,
                                                                                                                                                                                messageUserAgentsAnnee: `${messageDifferenceUserAgentsAnnee}`,

                                                                                                                                                                                differenceAbsolueClicksAnnee,
                                                                                                                                                                                messageClicksAnnee: `${messageDifferenceClicksAnnee}`,
                                                                                                                                                                            });
                                                                                                                                                                        });
                                                                                                                                                                    });
                                                                                                                                                                });
                                                                                                                                                            });
                                                                                                                                                        });
                                                                                                                                                    });
                                                                                                                                                });
                                                                                                                                            });
                                                                                                                                        });
                                                                                                                                    });
                                                                                                                                });
                                                                                                                            });
                                                                                                                        });
                                                                                                                    });
                                                                                                                });
                                                                                                            });
                                                                                                        });
                                                                                                    });
                                                                                                });
                                                                                            });
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.getProjets = (req, res) => {
    if (!loggedInClientId) {
        return res.redirect('/connecter');
    }

    // Recherche du profil du client dans la base de données
    db.query('SELECT UPPER(SUBSTRING(username, 1, 1)) AS first_letter FROM clients WHERE id = ?', [loggedInClientId], (error, results) => {
        if (error) {
            console.error(error);
            return res.render('error', {
                message: 'Une erreur s\'est produite lors de la récupération du profil du client'
            });
        }

        if (results.length === 0) {
            return res.render('error', {
                message: 'Profil du client non trouvé'
            });
        }
        // const currentDate = new Date();
        // const nextDay = new Date(currentDate);
        // nextDay.setDate(currentDate.getDate() + 1);
        // const nextDayISO = nextDay.toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        db.query('SELECT * FROM urls WHERE client_id = ? AND DATE(created_at) = ?', [loggedInClientId, today], (error, urlResultsToday) => {
            if (error) {
                console.error(error);
                return res.status(500).render('error', {
                    message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                });
            }

            // Sélectionner tous les URLs du client connecté à partir de la base de données
            db.query('SELECT * FROM urls WHERE client_id = ?', [loggedInClientId], (error, urlResultsAll) => {
                if (error) {
                    console.error(error);
                    return res.status(500).render('error', {
                        message: 'Une erreur s\'est produite lors de la récupération des URLs du client.'
                    });
                }

                // Afficher le profil du client avec les URLs associées
                res.render('projets', { client: results[0], urls: urlResultsAll, urlsToday: urlResultsToday });
            });
        });
    });
};

exports.getLogout = (req, res) => {
    if (loggedInClientId) {
        // Si un client est connecté, déconnectez-le en réinitialisant l'ID du client connecté
        loggedInClientId = null;
    }
    // Rediriger vers la page d'accueil ou une autre page après la déconnexion
    res.redirect('/');
};

///////////////////////////////////////////////////////////////////////////////////////////////

module.exports = exports;