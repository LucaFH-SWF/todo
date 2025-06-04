import express from 'express';
import api from './api.js';

/** Zentrales Objekt für unsere Express-Applikation */
const app = express();
app.use(express.json());

// Alle ToDos abrufen
app.get('/api/todos', api.getTodos);

// Alle ToDos abrufen
app.get('/api/todos/:id', api.getTodo);

// Neues ToDo anlegen
app.post('/api/todos', api.newTodo);

// ToDo aktualisieren
app.put('/api/todos/:id', api.updateTodo);

// ToDo löschen
app.delete('/api/todos/:id', api.deleteTodo);

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});