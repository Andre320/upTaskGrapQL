const mongoose = require('mongoose');

const TareaSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: true,
        trim: true
    },
    creador:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    },
    proyecto:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto'
    },
    estado:{
        type: Boolean,
        default: false
    },
    creado:{
        type: Date,
        default: Date.now()
    }

});

module.exports = mongoose.model('Tarea', TareaSchema);