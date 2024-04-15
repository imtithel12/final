
const express = require('express');
const app = express();
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');
const routes = require('./router/routes');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const router = require('./controllers/authController');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));


dotenv.config({ path: './.env' });

// Middleware
app.set('view engine', 'hbs');
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Routes
app.use('/', routes);

const PORT = process.env.PORT || 3008;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

///////////////////////////////////////////////////////////////////////////////////