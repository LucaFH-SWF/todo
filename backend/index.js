import express from 'express';
import api from './api.js';

import path from 'path';
import { fileURLToPath } from 'url';

import { check, validationResult } from 'express-validator';

/** Zentrales Objekt für unsere Express-Applikation */
const app = express();
app.use(express.json());

// Middleware für Validierung der ToDo-Daten
const todoValidationRules = [
    check('title')
        .notEmpty()
        .withMessage('Titel darf nicht leer sein')
        .isLength({ min: 3 })
        .withMessage('Titel muss mindestens 3 Zeichen lang sein'),
    check('text')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Text darf maximal 500 Zeichen lang sein'),
    check('due')
        .isISO8601()
        .toDate()
        .withMessage('Fälligkeitsdatum muss ein gültiges Datum sein')
];

// Alle ToDos abrufen
app.get('/api/todos', api.getTodos);

// ein ToDo abrufen
app.get('/api/todos/:id', api.getTodo);

// Neues ToDo anlegen
app.post('/api/todos', todoValidationRules, api.newTodo);

// ToDo aktualisieren
app.put('/api/todos/:id', todoValidationRules, api.updateTodo);

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