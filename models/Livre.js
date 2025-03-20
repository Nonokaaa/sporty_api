// models/Livre.js
const mongoose = require('mongoose');

const LivreSchema = new mongoose.Schema({
    titre: { 
        type: String, 
        required: true 
    },
    auteurs: { 
        type: [String], 
        required: true, 
    },
    ISBN: { 
        type: String, 
        required: true,
    },
    categorie: {
        type: String,
        enum: ['Programming 💻' , 'DevOps 🪐' , 'Design 🎨' , 'Other ❓'],
        required: true,
    },
    nombrePages: {
        type: Number,
        required: true,
    },
    statutLecture: {
        type: String,
        enum: ['A lire 📅' , 'En cours ⏳' , 'Terminé 🎉'],
        required: true,
    },
    notesPersonnelles: {
        type: [String],
    },
});

module.exports = mongoose.model('Livre', LivreSchema);