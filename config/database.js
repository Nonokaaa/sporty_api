const mongoose = require('mongoose');

const URI_MONGODB = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.wgk1j.mongodb.net/${process.env.DB_NAME}`;

const connectToDB = async () => {
    try {
        await mongoose.connect(URI_MONGODB);
        // Add this somewhere in your code to log the connection pool status
        console.log('La connexion à la base de données a été établie avec succès.');
    } catch (error) {
        console.error('Impossible de se connecter à la base de données:', error);
    }
};

module.exports = { connectToDB };