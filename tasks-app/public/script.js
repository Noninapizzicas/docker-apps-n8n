const socket = io();
let data = null;
let nextTaskId = 1;

socket.on('initial-data', (boardData) => {
    data = boardData;
    nextTaskId = getMaxTaskId() + 1;
    renderBoard();
});

socket.on('task-updated', (update) => {
    console.log('Recibida actualización:', update);
    let updated = false;
    data.columns.forEach(column => {
        column.tasks.forEach(task => {
            if (task.id === update.taskId) {
                task.completed = update.completed;
                updated = true;
            }
        });
    });
    if (updated) {
        renderBoard();
        showStatus('Tarea actualizada por otro usuario');
    }
});

socket.on('task-moved', (update) => {
    moveTask(update.taskId, update.fromColumn, update.toColumn);
    showStatus('Tarea movida por otro usuario');
});

socket.on('task-added', (task) => {
    data.columns[0].tasks.push(task);
    nextTaskId = Math.max(nextTaskId, task.id + 1);
    renderBoard();
    showStatus('Nueva tarea añadida por otro usuario');
});

socket.on('task-deleted', (taskId) => {
    deleteTask(taskId, false);
    showStatus('Tarea eliminada por otro usuario');
});

socket.on('task-text-updated', (update) => {
    updateTaskText(update.taskId, update.newText, false);
    showStatus('Tarea editada por otro usuario');
});

socket.on('column-title-updated', (update) => {
    data.columns[update.columnIndex].title = update.newTitle;
    renderBoard();
    showStatus('Título de columna actualizado por otro usuario');
});

function getMaxTaskId() {
    let maxId = 0;
    data.columns.forEach(column => {
        column.tasks.forEach(task => {
            maxId = Math.max(maxId, task.id);
        });
    });
    return maxId;
}

function handleNewTaskKeyPress(event) {
    if (event.key === 'Enter') {
        addTask();
    }
}

function addTask() {
    const input = document.getElementById('newTask');
    const text = input.value.trim();
    
    if (text) {
        const task = {
            id: nextTaskId++,
            text: text,
            completed: false
        };
        
        data.columns[0].tasks.push(task);
        socket.emit('task-added', task);
        input.value = '';
        renderBoard();
        showStatus('Nueva tarea añadida');
    }
}

function showStatus(message) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.classList.add('show');
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 2000);
}

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    data.columns.forEach((column, columnIndex) => {
        const columnEl = document.createElement('div');
        columnEl.className = 'column';
        columnEl.setAttribute('data-column', columnIndex);
        
        columnEl.addEventListener('dragover', handleDragOver);
        columnEl.addEventListener('drop', handleDrop);
        columnEl.addEventListener('dragleave', handleDragLeave);
        
        const headerEl = document.createElement('div');
        headerEl.className = 'column-header';
        
        const titleEl = document.createElement('h2');
        titleEl.className = 'column-title';
        titleEl.textContent = column.title;
        titleEl.onclick = () => startEditingColumnTitle(titleEl, columnIndex);
        
        headerEl.appendChild(titleEl);
        columnEl.appendChild(headerEl);
        
        column.tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `task ${task.completed ? 'completed' : ''}`;
            taskEl.setAttribute('draggable', true);
            taskEl.setAttribute('data-task-id', task.id);
            
            taskEl.addEventListener('dragstart', handleDragStart);
            taskEl.addEventListener('dragend', handleDragEnd);
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.onchange = () => toggleTask(task.id);
            
            const textEl = document.createElement('span');
            textEl.className = 'task-text';
            textEl.textContent = task.text;
            textEl.onclick = () => startEditingTaskText(textEl, task.id);
            
            const actionsEl = document.createElement('div');
            actionsEl.className = 'task-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteTask(task.id, true);
            };
            
            actionsEl.appendChild(deleteBtn);
            
            taskEl.appendChild(checkbox);
            taskEl.appendChild(textEl);
            taskEl.appendChild(actionsEl);
            columnEl.appendChild(taskEl);
        });
        
        board.appendChild(columnEl);
    });
}

function toggleTask(taskId) {
    let completed = false;
    data.columns.forEach(column => {
        column.tasks.forEach(task => {
            if (task.id === taskId) {
                task.completed = !task.completed;
                completed = task.completed;
            }
        });
    });
    
    socket.emit('task-update', { 
        taskId: taskId, 
        completed: completed 
    });
    renderBoard();
    showStatus('Estado actualizado');
}

function startEditingColumnTitle(titleEl, columnIndex) {
    const currentTitle = titleEl.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentTitle;
    input.className = 'column-title-input';
    
    input.onblur = () => finishEditingColumnTitle(input, titleEl, columnIndex);
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
        if (e.key === 'Escape') {
            titleEl.textContent = currentTitle;
            titleEl.style.display = 'block';
            input.remove();
        }
    };
    
    titleEl.style.display = 'none';
    titleEl.parentNode.insertBefore(input, titleEl);
    input.focus();
    input.select();
}

function finishEditingColumnTitle(input, titleEl, columnIndex) {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== titleEl.textContent) {
        titleEl.textContent = newTitle;
        data.columns[columnIndex].title = newTitle;
        socket.emit('column-title-update', {
            columnIndex,
            newTitle
        });
        showStatus('Título de columna actualizado');
    }
    titleEl.style.display = 'block';
    input.remove();
}

function startEditingTaskText(textEl, taskId) {
    const currentText = textEl.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.className = 'task-text-input';
    
    input.onblur = () => finishEditingTaskText(input, textEl, taskId);
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            input.blur();
        }
        if (e.key === 'Escape') {
            textEl.textContent = currentText;
            textEl.style.display = 'inline';
            input.remove();
        }
    };
    
    textEl.style.display = 'none';
    textEl.parentNode.insertBefore(input, textEl);
    input.focus();
    input.select();
}

function finishEditingTaskText(input, textEl, taskId) {
    const newText = input.value.trim();
    if (newText && newText !== textEl.textContent) {
        updateTaskText(taskId, newText, true);
    }
    textEl.style.display = 'inline';
    input.remove();
}

function updateTaskText(taskId, newText, emit = true) {
    data.columns.forEach(column => {
        column.tasks.forEach(task => {
            if (task.id === taskId) {
                task.text = newText;
            }
        });
    });
    if (emit) {
        socket.emit('task-text-update', { taskId, newText });
        showStatus('Texto de tarea actualizado');
    }
    renderBoard();
}

function deleteTask(taskId, emit = true) {
    data.columns.forEach(column => {
        column.tasks = column.tasks.filter(task => task.id !== taskId);
    });
    if (emit) {
        socket.emit('task-deleted', taskId);
        showStatus('Tarea eliminada');
    }
    renderBoard();
}

// Drag and Drop
let draggedTask = null;
let sourceColumn = null;

function handleDragStart(e) {
    draggedTask = e.target;
    sourceColumn = parseInt(e.target.parentNode.getAttribute('data-column'));
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.column').forEach(col => {
        col.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const targetColumn = parseInt(e.currentTarget.getAttribute('data-column'));
    e.currentTarget.classList.remove('drag-over');
    
    if (sourceColumn !== targetColumn) {
        const taskId = parseInt(draggedTask.getAttribute('data-task-id'));
        moveTask(taskId, sourceColumn, targetColumn);
        socket.emit('task-moved', {
            taskId,
            fromColumn: sourceColumn,
            toColumn: targetColumn
        });
        showStatus('Tarea movida');
    }
}

function moveTask(taskId, fromColumn, toColumn) {
    const task = data.columns[fromColumn].tasks.find(t => t.id === taskId);
    if (task) {
        data.columns[fromColumn].tasks = data.columns[fromColumn].tasks.filter(t => t.id !== taskId);
        data.columns[toColumn].tasks.push(task);
        renderBoard();
    }
}
