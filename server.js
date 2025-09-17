require('dotenv').config();
const path = require('path');
const express = require('express');
const app = express();
const db = require('./src/db');
// ⬇️ tambahkan:
const engine = require('ejs-mate');
app.engine('ejs', engine);

const PORT = process.env.PORT || 3000;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '5mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));


// Routes
const uiRoutes = require('./src/routes/ui');
const apiRoutes = require('./src/routes/api');
app.use('/', uiRoutes);
app.use('/api', apiRoutes);


app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

