/*
    ____   ____.___    _________       _____  __                                 
\   \ /   /|   |  /   _____/ _____/ ____\/  |___  _  _______ _______   ____  
 \   Y   / |   |  \_____  \ /  _ \   __\\   __\ \/ \/ /\__  \\_  __ \_/ __ \ 
  \     /  |   |  /        (  <_> )  |   |  |  \     /  / __ \|  | \/\  ___/ 
   \___/   |___| /_______  /\____/|__|   |__|   \/\_/  (____  /__|    \___  >
                         \/                                 \/            \/ 
                         
                         
    Copyright 2024 (©) VI Software y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/VI-Software
    Web: https://vis.galnod.com

*/

const express = require('express');
const bodyParser = require('body-parser');
const skinController = require('./controllers/skinController');
const morgan = require('morgan'); // Step 1: Import morgan
const fs = require('fs'); // Step 2: Import fs
const path = require('path'); // Step 2: Import path

const app = express();
app.use(bodyParser.json());
require('dotenv').config();

// Step 3: Create a write stream for logging
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// Step 4: Configure morgan to use the write stream
app.use(morgan('combined', { stream: accessLogStream }));

// routes
app.get('/', (req, res) => {
    res.json({ status: 'OK', 'statusCode': '200', 'Runtime-Mode': 'productionMode', 'Application-Author': 'The VI Software Team', 'Application-Description': 'VI Software skin rendering service', 'Specification-Version': require('../package.json').version, 'Application-Name': 'visoftware.dev.skin.render-server.public' });
});

app.get('/2d/skin/:name/:type', skinController.getSkin);

// Custom error handler
app.use((req, res, next) => {
    res.status(404).json({ code: '404', error: 'Not found' });
});
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
