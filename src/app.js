/*
    ____   ____.___    _________       _____  __                                 
\   \ /   /|   |  /   _____/ _____/ ____\/  |___  _  _______ _______   ____  
 \   Y   / |   |  \_____  \ /  _ \   __\\   __\ \/ \/ /\__  \\_  __ \_/ __ \ 
  \     /  |   |  /        (  <_> )  |   |  |  \     /  / __ \|  | \/\  ___/ 
   \___/   |___| /_______  /\____/|__|   \/\_/  (____  /__|    \___  >
                         \/                                 \/            \/ 
                         
                         
    Copyright 2024 (©) VI Software y contribuidores. Todos los derechos reservados.
    
    GitHub: https://github.com/VI-Software
    Web: https://vis.galnod.com

*/

const express = require('express');
const bodyParser = require('body-parser');
const skinController = require('./controllers/skinController');
const { logsMiddleware } = require('./middleware/logger');

const app = express();
app.use(bodyParser.json());
app.use(logsMiddleware);
require('dotenv').config();

// routes
app.get('/', (req, res) => {
    res.json({ status: 'OK', 'statusCode': '200', 'Runtime-Mode': 'productionMode', 'Application-Author': 'The VI Software Team', 'Application-Description': 'VI Software skin rendering service', 'Specification-Version': require('../package.json').version, 'Application-Name': require('../package.json').name });
});

app.get('/2d/skin/:name/:type', skinController.getSkin);

// Custom error handler
app.use((req, res, next) => {
    res.status(404).json({ code: '404', error: 'Not found' });
});

// Add global error handlers before starting the server
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});

// Update error handler middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        code: '500',
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
