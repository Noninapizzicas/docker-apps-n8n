const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');

app.use(express.static(path.join(__dirname, 'public')));

// Ruta al archivo JSON para persistencia
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

// Asegurar que el directorio data existe
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Estructura inicial de datos
let boardData = {
    columns: [
        {
            id: 1,
            title: "Por hacer",
            tasks: []
        },
        {
            id: 2,
            title: "En progreso",
            tasks: []
        },
        {
            id: 3,
            title: "Revisión",
            tasks: []
        },
        {
            id: 4,
            title: "Completado",
            tasks: []
        }
    ]
};

// Cargar datos del archivo JSON si existe
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            boardData = JSON.parse(data);
            console.log('Datos cargados del archivo JSON');
        } else {
            saveData(); // Crear archivo con datos iniciales
            console.log('Archivo JSON inicial creado');
        }
    } catch (err) {
        console.error('Error al cargar datos:', err);
    }
}

// Guardar datos en el archivo JSON
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(boardData, null, 2), 'utf8');
        console.log('Datos guardados en archivo JSON');
    } catch (err) {
        console.error('Error al guardar datos:', err);
    }
}

// Cargar datos al iniciar
loadData();

io.on('connection', (socket) => {
    console.log('Cliente conectado');
    socket.emit('initial-data', boardData);
    
    // Actualizar título de columna
    socket.on('column-title-update', (update) => {
        const { columnIndex, newTitle } = update;
        if (boardData.columns[columnIndex]) {
            boardData.columns[columnIndex].title = newTitle;
            saveData();
            socket.broadcast.emit('column-title-updated', update);
        }
    });

    // Añadir nueva tarea
    socket.on('task-added', (task) => {
        boardData.columns[0].tasks.push(task);
        saveData();
        socket.broadcast.emit('task-added', task);
    });

    // Actualizar estado de tarea
    socket.on('task-update', (update) => {
        const { taskId, completed } = update;
        let taskFound = false;
        
        boardData.columns.forEach(column => {
            column.tasks.forEach(task => {
                if (task.id === taskId) {
                    task.completed = completed;
                    taskFound = true;
                }
            });
        });

        if (taskFound) {
            saveData();
            socket.broadcast.emit('task-updated', update);
        }
    });
    
    // Mover tarea entre columnas
    socket.on('task-moved', (update) => {
        const { taskId, fromColumn, toColumn } = update;
        let task = null;
        
        boardData.columns[fromColumn].tasks = boardData.columns[fromColumn].tasks.filter(t => {
            if (t.id === taskId) {
                task = t;
                return false;
            }
            return true;
        });
        
        if (task) {
            boardData.columns[toColumn].tasks.push(task);
            saveData();
            socket.broadcast.emit('task-moved', update);
        }
    });

    // Eliminar tarea
    socket.on('task-deleted', (taskId) => {
        boardData.columns.forEach(column => {
            column.tasks = column.tasks.filter(task => task.id !== taskId);
        });
        saveData();
        socket.broadcast.emit('task-deleted', taskId);
    });

    // Editar texto de tarea
    socket.on('task-text-update', (update) => {
        const { taskId, newText } = update;
        boardData.columns.forEach(column => {
            column.tasks.forEach(task => {
                if (task.id === taskId) {
                    task.text = newText;
                }
            });
        });
        saveData();
        socket.broadcast.emit('task-text-updated', update);
    });

    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
