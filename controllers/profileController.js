const bcrypt = require('bcryptjs');
const db = require('../config/database');
const nodemailer = require('nodemailer');


exports.getForgotPassword = (req, res) => {
    res.render('forgotPassword');
};

exports.postForgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // Vérifier si l'email existe dans la base de données
        const [rows] = await db.query('SELECT * FROM clients WHERE email = ?', [email]);

        if (rows.length === 0) {
            // Aucun compte associé à cet email
            return res.render('forgotPassword', { message: 'Aucun compte n\'est associé à cet email!' });
        }

        // Générer un token de réinitialisation de mot de passe (vous pouvez utiliser une bibliothèque pour générer des tokens sécurisés)
        const resetToken = 'your_generated_reset_token';

        // Stocker le token dans la base de données ou un cache avec l'email associé
        // Enregistrez le token dans la base de données pour l'utilisateur pour vérification ultérieure

        // Envoyer un email au client avec un lien pour réinitialiser le mot de passe
        // Vous pouvez utiliser un service comme nodemailer pour envoyer des emails
        // Assurez-vous d'avoir configuré votre service d'envoi d'e-mails

        return res.render('forgotPassword', { message: 'Un email de réinitialisation de mot de passe a été envoyé!' });
    } catch (error) {
        console.error(error);
        return res.render('forgotPassword', { message: 'Une erreur s\'est produite lors de la réinitialisation de mot de passe!' });
    }
};

exports.getResetPassword = (req, res) => {
    const { token, email } = req.query;

    // Vérifiez si le token est valide (vérifiez si le token existe dans la base de données ou le cache avec l'email associé)
    // Si le token est valide, affichez le formulaire de réinitialisation de mot de passe
    // Sinon, affichez un message d'erreur ou redirigez l'utilisateur vers une autre page
    res.render('resetPassword', { token, email });
};

exports.postResetPassword = async (req, res) => {
    const { token, email, newPassword } = req.body;

    try {
        // Vérifiez si le token est valide (vérifiez si le token existe dans la base de données ou le cache avec l'email associé)
        // Si le token est valide, mettez à jour le mot de passe de l'utilisateur avec le nouveau mot de passe

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        // Mettre à jour le mot de passe dans la base de données pour l'utilisateur avec cet email
        await db.query('UPDATE clients SET password = ? WHERE email = ?', [hashedPassword, email]);

        // Affichez un message de succès ou redirigez l'utilisateur vers une page de connexion
        return res.render('resetPassword', { message: 'Votre mot de passe a été réinitialisé avec succès!' });
    } catch (error) {
        console.error(error);
        return res.render('resetPassword', { message: 'Une erreur s\'est produite lors de la réinitialisation de mot de passe!' });
    }
};