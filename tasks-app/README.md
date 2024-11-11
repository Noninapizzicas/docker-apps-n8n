# Tasks App - Aplicación de Tareas Colaborativas

Aplicación web en tiempo real para gestión de tareas en equipo.

## Estructura


tasks-app/
├── Dockerfile          # Configuración de contenedor
├── package.json        # Dependencias Node.js
├── server.js          # Servidor Express + Socket.IO
├── data/              # Almacenamiento de datos (JSON)
└── public/            # Archivos estáticos
└── index.html     # Interfaz de usuario
Copy
## Características

### Tiempo Real
- Sincronización instantánea entre usuarios
- WebSocket para actualizaciones en vivo
- Notificaciones de cambios

### Gestión de Tareas
- Crear nuevas tareas
- Editar títulos y contenido
- Marcar como completadas
- Eliminar tareas
- Arrastrar y soltar entre columnas

### Columnas Personalizables
- Títulos editables
- Cuatro estados predeterminados:
  - Por hacer
  - En progreso
  - Revisión
  - Completado

### Persistencia de Datos
- Almacenamiento en JSON
- Recuperación automática al reiniciar
- Backup automático de cambios

## Tecnologías Utilizadas
- Node.js
- Express
- Socket.IO
- Docker

## Desarrollo

### Requisitos Previos
- Node.js v18 o superior
- Docker

### Instalación Local
```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
node server.js
Docker
bashCopy# Construir imagen
docker build -t tasks-app .

# Ejecutar contenedor
docker run -p 3000:3000 tasks-app
API WebSocket
Eventos del Cliente

task-added: Nueva tarea creada
task-update: Actualización de estado
task-moved: Cambio de columna
task-deleted: Eliminación de tarea
task-text-update: Edición de texto
column-title-update: Cambio de título de columna

Eventos del Servidor

initial-data: Datos iniciales
task-updated: Confirmación de actualización
task-moved: Confirmación de movimiento
column-title-updated: Confirmación de cambio de título

Estructura de Datos
javascriptCopy{
    columns: [
        {
            id: number,
            title: string,
            tasks: [
                {
                    id: number,
                    text: string,
                    completed: boolean
                }
            ]
        }
    ]
}
Contribuir

Fork del repositorio
Crear rama para feature (git checkout -b feature/NuevaFuncionalidad)
Commit cambios (git commit -am 'Añadir nueva funcionalidad')
Push a la rama (git push origin feature/NuevaFuncionalidad)
Crear Pull Request

Futuras Mejoras

 Autenticación de usuarios
 Múltiples tableros
 Etiquetas para tareas
 Filtros y búsqueda
 Modo oscuro
 Exportación de datos

