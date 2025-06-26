let TODOS = [];

var showDone = true;

const LOGIN_URL = "https://keycloak.gawron.cloud/realms/webentwicklung/protocol/openid-connect/auth"

/** Check whether we need to login.
 * Check the status of a response object. If the status is 401, construct an appropriate 
 * login URL and redict there.
 * 
 * @param response Response object to check
 * @returns original response object if status is not 401
 */
function checkLogin(response) {
    // check if we need to login
    if (response.status == 401) {
        console.log("GET request returned 401, need to log in")
        let state = document.cookie
            .split('; ')
            .find((row) => row.startsWith("state="))
            ?.split("=")[1]
        console.log("state: %s", state)
        let params = new URLSearchParams()
        params.append("response_type", "code")
        params.append("redirect_uri", new URL("/oauth_callback", window.location))
        params.append("client_id", "todo-backend")
        params.append("scope", "openid")
        params.append("state", state)

        // redirect to login URL with proper parameters
        window.location = LOGIN_URL + "?" + params.toString()
        throw ("Need to log in")
    }
    else return response
}

async function init() {
    let response = await fetch('/api/todos')
    .then(checkLogin);

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
        todoItem.dataset.id = todo[i]._id;

        const dueDate = new Date(todo[i].due);
        const formattedDate = dueDate.toLocaleString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (typeof todo[i].text === 'undefined' || todo[i].text === undefined) {
            todo[i].text = '';
        }

        todoItem.insertAdjacentHTML('beforeend', `
            <div>
                <header><h2>${todo[i].title}</h2></header>
                <time datetime="${todo[i].due}">${formattedDate}</time>
                <p class="todo-text">${todo[i].text}</p>
            </div>
            <div class="todo-bar">
                <select name="status" class="status" id="status" onchange="updateTodoStatus('${todo[i]._id}', this.value)">
                    <option value="open" ${todo[i].status === 'open' ? 'selected' : ''}>offen</option>
                    <option value="doing" ${todo[i].status === 'doing' ? 'selected' : ''}>in Arbeit</option>
                    <option value="done" ${todo[i].status === 'done' ? 'selected' : ''}>erledigt</option>
                </select>
                <button class="delete" onclick="deleteTodo('${todo[i]._id}')">Löschen</button>
                <button class="edit" onclick="editTodo('${todo[i]._id}')">Bearbeiten</button>
            </div>
        `);
        
        main.appendChild(todoItem);
    }
}

async function updateTodoStatus(id, status) {
    const todo = TODOS.find(todo => todo._id === id);
    if (!todo) {
        console.log(`Todo mit ID ${id} nicht gefunden.`);
        return;
    }

    let title = todo.title;
    let due = todo.due;
    let text = todo.text;
    let userId = todo.userId;
    
    let response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({title, due, text, status, userId})
    }).then(checkLogin);
    
    if(response.ok) {
        todo.status = status;
        showTodos();
    }
}

async function addTodo() {
    let Aufgabe = document.getElementById('Aufgabe').value;
    let Datum = document.getElementById('Datum').value;
    let  Notiz = document.getElementById('Notiz').value;

    if (new Date(Datum) < Date.now()) {
        alert('Das Fälligkeitsdatum darf nicht in der Vergangenheit liegen.');
        return;
    }

    const newTodo = {
        title: Aufgabe,
        due: Datum,
        text: Notiz,
        status: 'open'
    };

    let response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTodo)
    })
    .then(checkLogin);

    if(response.ok) {
        const createdTodo = await response.json();
        newTodo._id = createdTodo._id; // ID vom Server erhalten
        TODOS.push(newTodo);
        
        document.getElementById('Datum').value = '';
        document.getElementById('Aufgabe').value = '';
        document.getElementById('Notiz').value = '';
        
        showTodos();
    }
    else {
        console.log('Fehler beim Hinzufügen der Aufgabe:', response.statusText);
    }

}

async function deleteTodo(id) {
    let response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
    })
    .then(checkLogin);

    if(response.ok) {
        let todoIndex = TODOS.findIndex(todo => todo._id === id);
        if (todoIndex !== -1) {
            TODOS.splice(todoIndex, 1);

            let elem = document.querySelector(`[data-id='${id}']`);
            elem.remove();
        }
        else {
            console.log(`Todo with ID ${id} not found.`);
        }
    }
    else {
        console.log('Fehler beim Löschen der Aufgabe:', response.statusText);
    }
}

function toDatetimeLocalValue(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
}

function editTodo(id) {
    const todo = TODOS.find(todo => todo._id === id);
    if (todo) {
        let elem = document.querySelector(`[data-id='${id}']`);
        elem.innerHTML = '';

        const due = new Date(todo.due);
        const formattedDate = toDatetimeLocalValue(due); // Lokale Zeit!

        elem.insertAdjacentHTML('beforeend', `
            <div>
                <input type="text" id="editTitle" value="${todo.title}">
                <input type="datetime-local" id="editDue" value="${formattedDate}">
                <textarea id="editText">${todo.text}</textarea>
                <button onclick="saveEdit('${id}')">Speichern</button>
            </div>
        `);

        // Alle Buttons Bearbeiten deaktivieren
        const buttons = document.querySelectorAll('.edit, .delete, .status');
        buttons.forEach(btn => btn.disabled = true);
    } else {
        console.log(`Todo with ID ${id} not found.`);
    }
}

async function saveEdit(id) {
    let title = document.getElementById('editTitle').value;
    let due = document.getElementById('editDue').value;
    let dueUTC = new Date(due).toISOString()
    let text = document.getElementById('editText').value;
    let status = TODOS.find(todo => todo._id === id).status;

    let response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, due:dueUTC, text, status })
    })
    .then(checkLogin);

    if(response.ok) {
        const todo = TODOS.find(todo => todo._id === id);
        if (todo) {
            todo.title = title;
            todo.due = due;
            todo.text = text;
            showTodos();
        } else {
            console.log(`Todo with ID ${id} not found.`);
        }
    }
    else {
        const error = await response.json();
        console.log('Fehler beim Speichern der Aufgabe:', error);
        alert(error.errors ? error.errors.map(e => e.msg).join('\n') : error.error || 'Unbekannter Fehler');
    }
    
}

//erledigte Aufgaben ausblenden
function toggleDone() {
    showDone = !showDone;

    let toggleButton = document.getElementById('toggleDoneBtn');
    toggleButton.innerText = showDone ? 'Erledigte Aufgaben ausblenden' : 'Erledigte Aufgaben anzeigen';

    showTodos();
}