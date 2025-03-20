const mongoose = require('mongoose');



const URI_MONGODB = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.ppbs4ac.mongodb.net/`

const connectToDB = async () => {
    try {
        await mongoose.connect(URI_MONGODB);
        console.log('La connexion à la base de données a été établie avec succès.');
    } catch (error) {
        console.error('Impossible de se connecter à la base de données:', error);
    }
};

module.exports = { connectToDB };