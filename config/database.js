// database.js
const mysql = require("mysql");
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


db.connect((error) => {
    if (error) {
        console.log(error);
    } else {
        console.log("MySQL connected!");
    }
});


// Définissez la fonction getAllClients pour récupérer tous les clients
// const getAllClients = (callback) => {
//     db.query('SELECT * FROM clients', (err, results) => {
//         if (err) {
//             callback(err, null);
//         } else {
//             callback(null, results);
//         }
//     });
// };

const getAllClients = (callback) => {
    db.query('SELECT clients.*, COUNT(urls.id) AS urlCount FROM clients LEFT JOIN urls ON clients.id = urls.client_id GROUP BY clients.id', (err, results) => {
        if (err) {
            callback(err, null);
        } else {
            callback(null, results);
        }
    });
};




module.exports = db;
module.exports.getAllClients = getAllClients;

