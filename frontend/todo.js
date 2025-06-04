let TODOS = [];

var showDone = true;

async function init() {
    let response = await fetch('/api/todos');
    if (response.ok) {
        TODOS = await response.json();
    }

    showTodos();
}

function showTodos() {
    let main = document.getElementById('main');
    let todo = TODOS;

    todo.sort((a, b) => new Date(a.due) - new Date(b.due)); // nach Datum sortieren

    // Sortieren nach Status: 'open' und 'doing' zuerst, dann 'done'
    todo.sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (a.status !== 'done' && b.status === 'done') return -1;
        return 0;
    });

    main.innerHTML = '';

    if (todo.length === 0) {
        main.innerHTML = '<p>Keine Aufgaben vorhanden.</p>';
        return;
    }

    for (let i = 0; i < todo.length; i++) {
        if (!showDone && todo[i].status === 'done') {
            continue; // überspringe erledigte Aufgaben
        }

        let todoItem = document.createElement('div');
        todoItem.className = 'todo-item';
        todoItem.dataset.id = todo[i].id;

        const dueDate = new Date(todo[i].due);
        const formattedDate = dueDate.toLocaleString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        todoItem.insertAdjacentHTML('beforeend', `
            <div>
                <header><h2>${todo[i].title}</h2></header>
                <time datetime="${todo[i].due}">${formattedDate}</time>
                <p class="todo-text">${todo[i].text}</p>
            </div>
            <div class="todo-bar">
                <select name="status" class="status" id="status" onchange="updateTodoStatus(${todo[i].id}, this.value)">
                    <option value="open" ${todo[i].status === 'open' ? 'selected' : ''}>offen</option>
                    <option value="doing" ${todo[i].status === 'doing' ? 'selected' : ''}>in Arbeit</option>
                    <option value="done" ${todo[i].status === 'done' ? 'selected' : ''}>erledigt</option>
                </select>
                <button class="delete" onclick="deleteTodo(${todo[i].id})">Löschen</button>
                <button class="edit" onclick="editTodo(${todo[i].id})">Bearbeiten</button>
            </div>
        `);

        
        main.appendChild(todoItem);
    }
    saveLocalStorage();
}

function saveLocalStorage() {
    localStorage.setItem('todos', JSON.stringify(TODOS));
}

function updateTodoStatus(id, status) {
    const todo = TODOS.find(todo => todo.id === id);
    if (todo) {
        todo.status = status;
        showTodos();
    } else {
        console.log(`Todo with ID ${id} not found.`);
    }
}

function addTodo() {
    let Aufgabe = document.getElementById('Aufgabe').value;
    let Datum = document.getElementById('Datum').value;
    let  Notiz = document.getElementById('Notiz').value;

    if (new Date(Datum) < Date.now()) {
        alert('Das Fälligkeitsdatum darf nicht in der Vergangenheit liegen.');
        return;
    }

    const newTodo = {
        id: Date.now(),
        title: Aufgabe,
        due: Datum,
        text: Notiz,
        status: 'open'
    };

    document.getElementById('Datum').value = '';
    document.getElementById('Aufgabe').value = '';
    document.getElementById('Notiz').value = '';

    TODOS.push(newTodo);
    showTodos();
}

function deleteTodo(id) {
    const todoIndex = TODOS.findIndex(todo => todo.id === id);
    if (todoIndex !== -1) {
        TODOS.splice(todoIndex, 1);

        let elem = document.querySelector(`[data-id='${id}']`);
        elem.remove();

        saveLocalStorage();
    } else {
        console.log(`Todo with ID ${id} not found.`);
    }
}

function editTodo(id) {
    const todo = TODOS.find(todo => todo.id === id);
    if (todo) {
        let elem = document.querySelector(`[data-id='${id}']`);
        elem.innerHTML = '';

        const due = new Date(todo.due);
        due.setHours(due.getHours() + 2); // UTC+2 für Mitteleuropäische Sommerzeit
        const formattedDate = due.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm

        elem.insertAdjacentHTML('beforeend', `
            <div>
                <input type="text" id="editTitle" value="${todo.title}">
                <input type="datetime-local" id="editDue" value="${formattedDate}">
                <textarea id="editText">${todo.text}</textarea>
                <button onclick="saveEdit(${id})">Speichern</button>
            </div>
        `);

        // Alle Buttons Bearbeiten deaktivieren
        const buttons = document.querySelectorAll('.edit, .delete, .status');
        buttons.forEach(btn => btn.disabled = true);
    } else {
        console.log(`Todo with ID ${id} not found.`);
    }
}

function saveEdit(id) {
    const todo = TODOS.find(todo => todo.id === id);
    if (todo) {
        todo.title = document.getElementById('editTitle').value;
        todo.due = document.getElementById('editDue').value;
        todo.text = document.getElementById('editText').value;
        showTodos();
        //document.getElementById('editDue').disabled = true;
    } else {
        console.log(`Todo with ID ${id} not found.`);
    }
}

//erledigte Aufgaben ausblenden
function toggleDone() {
    showDone = !showDone;

    let toggleButton = document.getElementById('toggleDoneBtn');
    toggleButton.innerText = showDone ? 'Erledigte Aufgaben ausblenden' : 'Erledigte Aufgaben anzeigen';

    showTodos();
}