const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path: 'variables.env'});

// Modelos
const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');
const Tarea = require('../models/Tarea');

// Crea y firma un JWT
const crearToken = (usuario, secreta, expiresIn) =>{
    const {id, email, nombre} = usuario;

    return jwt.sign({id, email, nombre}, secreta, {expiresIn});
}
const resolvers = {
    Query: {
        obtenerProyectos: async(root, {}, context)=>{
            const proyectos = await Proyecto.find({creador: context.id});

            return proyectos;
        },
        obtenerTareas: async(root, {proyecto}, context)=>{

            // Formas alternativas de hacerlo
            // const tareas = await Tarea.find({$and:[{creador: context.id}, {proyecto: proyecto}]});
            //const tareas = await Tarea.find({creador: context.id}).where('proyecto').equals(proyecto);
            const tareas = await Tarea.find({creador: context.id, proyecto: proyecto});

            return tareas;
        }
    },
    Mutation:{
        //--------------------------------------------------------------
        // Usuarios
        //--------------------------------------------------------------
        crearUsuario: async (root, {input}) =>{
            const {email, password} = input;
            
            const existeUsuario = await Usuario.findOne({email});

            // Si el usuario existe
            if(existeUsuario){
                throw new Error('El usuario ya está registrado');
            }

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            input.password = await bcrypt.hash(password, salt);

            // Registrar nuevo usuario
            try{
                const nuevoUsuario = new Usuario(input);

                nuevoUsuario.save();

                return "Usuario creado correctamente";
            }catch(error){
                console.log(error);
            }
        },
        autenticarUsuario: async(root, {input}) =>{
            const {email, password} = input;

            // Si el usuario existe
            const existeUsuario = await Usuario.findOne({email});
            if(!existeUsuario){
                throw new Error('El usuario no existe');
            }

            // Si el password existe
            const passwordCorrecto = await bcrypt.compare(password, existeUsuario.password);
            if(!passwordCorrecto){
                throw new Error('La contraseña es incorrecta');
            }

            // Dar acceso a la app
            return {
                token: crearToken(existeUsuario, process.env.SECRETA, '12hr')
            };
        },
        //--------------------------------------------------------------
        // Proyectos
        //--------------------------------------------------------------
        nuevoProyecto: async(root, {input}, context)=>{
            try {
                const proyecto = new Proyecto(input);

                // Asociar creador con el proyecto
                proyecto.creador = context.id;

                // Almaencar en la base de datos
                const resultado = await proyecto.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProyecto: async(root, {id, input}, context)=>{
            // Revisar si el proyecto existe
            let proyecto = await Proyecto.findById(id);

            if (!proyecto){
                throw new Error('Proyecto no encontrado');
            }

            // Revisar si la persona que esta editando es el propietario
            if(proyecto.creador.toString() !== context.id){
                throw new Error('No tienes las credenciales para editar');
            }

            // Actualizar el proyecto
            proyecto = await Proyecto.findOneAndUpdate({_id: id}, input, {new: true});

            return proyecto;
        },
        eliminarProyecto: async(root, {id}, context)=>{
            // Revisar si el proyecto existe
            let proyecto = await Proyecto.findById(id);

            if (!proyecto){
                throw new Error('Proyecto no encontrado');
            }
 
            // Revisar si la persona que esta editando es el propietario
            if(proyecto.creador.toString() !== context.id){
                throw new Error('No tienes las credenciales para editar');
            }

            // Eliminar proyecto
            await Proyecto.findOneAndDelete({_id: id});
            
            return 'Proyecto eliminado con éxito';
        },
        //--------------------------------------------------------------
        // Tareas
        //--------------------------------------------------------------
        nuevaTarea: async(root, {input}, context)=>{
            try {
                const tarea = new Tarea(input);

                // Asociar creador y proyecto con la tarea
                tarea.creador = context.id;

                // Almacenar en la base de datos
                const resultado = await tarea.save();

                return resultado;
            } catch (error) {
                console.log(error);
            }
        },
        actualizarTarea: async(root, {id, input, estado}, context)=>{
            // Revisar si la tarea existe
            let tarea = await Tarea.findById(id);
            console.log(tarea);
            if (!tarea){
                throw new Error('Tarea no encontrada');
            }

            // Revisar si la persona que esta editando es el propietario
            if(tarea.creador.toString() !== context.id){
                throw new Error('No tienes las credenciales para editar');
            }

            input.estado = estado;
            // Actualizar la tarea
            tarea = await Tarea.findOneAndUpdate({_id: id}, input, {new: true});

            return tarea;
        },
        eliminarTarea: async(root, {id}, context)=>{
            // Revisar si el tarea existe
            let tarea = await Tarea.findById(id);

            if (!tarea){
                throw new Error('Tarea no encontrado');
            }
 
            // Revisar si la persona que esta editando es el propietario
            if(tarea.creador.toString() !== context.id){
                throw new Error('No tienes las credenciales para editar');
            }

            // Eliminar tarea
            await Tarea.findOneAndDelete({_id: id});
            
            return 'Tarea eliminada con éxito';
        },
    }
}

module.exports = resolvers;
