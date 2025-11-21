require('dotenv').config();
const express = require('express');
const { sequelize, syncDatabase, Empresa } = require('./db');
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const commentRoutes = require('./routes/comments');
const generalRoutes = require('./routes/general'); // Require new general routes
const { importInitialData } = require('./utils/importData'); // We will create this later

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the current directory


// Routes
app.use('/auth', authRoutes);
app.use('/activities', activityRoutes);
app.use('/activities', commentRoutes); // Comments are nested under activities
app.use('/general', generalRoutes); // Use new general routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to the database has been established successfully.');
        await syncDatabase();
        
        // Import initial data after database sync, but only if needed
        // This check should be more robust in a production environment
        const empresaCount = await sequelize.models.Empresa.count();
        if (empresaCount === 0) { // Only import if no company data exists
            console.log('Importing initial data...');
            await importInitialData();
            console.log('Initial data imported successfully.');
        } else {
            console.log('Database already contains data, skipping import.');
        }

        

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database or start the server:', error);
    }
};

startServer();
