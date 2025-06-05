import express from 'express';
import api from './api.js';

import path from 'path';
import { fileURLToPath } from 'url';

/** Zentrales Objekt für unsere Express-Applikation */
const app = express();
app.use(express.json());

// Alle ToDos abrufen
app.get('/api/todos', api.getTodos);

// ein ToDo abrufen
app.get('/api/todos/:id', api.getTodo);

// Neues ToDo anlegen
app.post('/api/todos', api.newTodo);

// ToDo aktualisieren
app.put('/api/todos/:id', api.updateTodo);

// ToDo löschen
app.delete('/api/todos/:id', api.deleteTodo);

// Statische Dateien aus dem frontend-Ordner bereitstellen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/todo.html'));
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}/todo.html`);
});