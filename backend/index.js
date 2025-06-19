import express from 'express';
import api from './api.js';

import path from 'path';
import { fileURLToPath } from 'url';

import { check } from 'express-validator';

import cookieParser from 'cookie-parser';
import passport from './auth.js';

import fetch from 'node-fetch';

/** Zentrales Objekt für unsere Express-Applikation */
const app = express();
app.use(express.json());

app.use(cookieParser());
app.use(passport.initialize());

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
        .withMessage('Text darf maximal 500 Zeichen lang sein')
        .default(''), // Standardwert für Text
    check('due')
        .isISO8601()
        .toDate()
        .withMessage('Fälligkeitsdatum muss ein gültiges Datum sein')
        .custom((value) => {
            if (new Date(value) < new Date()) {
                throw new Error('Fälligkeitsdatum darf nicht in der Vergangenheit liegen');
            }
            return true;
        }),
    check('status')
        .isIn(['open', 'doing', 'done'])
        .withMessage('Status muss "open", "doing" oder "done" sein')
];

const todoValidationRulesUpdate = [
    check('title')
        .notEmpty()
        .withMessage('Titel darf nicht leer sein')
        .isLength({ min: 3 })
        .withMessage('Titel muss mindestens 3 Zeichen lang sein'),
    check('text')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Text darf maximal 500 Zeichen lang sein')
        .default(''), // Standardwert für Text
    check('due')
        .isISO8601()
        .toDate()
        .withMessage('Fälligkeitsdatum muss ein gültiges Datum sein'),
    check('status')
        .isIn(['open', 'doing', 'done'])
        .withMessage('Status muss "open", "doing" oder "done" sein')
];

// Alle ToDos abrufen
app.get('/api/todos', passport.authenticate('jwt', { session: false }), api.getTodos);

// ein ToDo abrufen
app.get('/api/todos/:id', passport.authenticate('jwt', { session: false }), api.getTodo);

// Neues ToDo anlegen
app.post('/api/todos', todoValidationRules, passport.authenticate('jwt', { session: false }), api.newTodo);

// ToDo aktualisieren
app.put('/api/todos/:id', todoValidationRulesUpdate, passport.authenticate('jwt', { session: false }), api.updateTodo);

// ToDo löschen
app.delete('/api/todos/:id', passport.authenticate('jwt', { session: false }), api.deleteTodo);

app.get('/oauth_callback', async (req, res) => {
    try {
        const code = req.query.code;
        const PORT = process.env.PORT || 3000;
        const HOST = `${process.env.CODESPACE_NAME}-${PORT}.app.github.dev`;
        const REDIRECT_URI = `https://${HOST}/oauth_callback`;

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('client_id', 'todo-backend');
        // params.append('client_secret', 'HIER_CLIENT_SECRET'); // nur falls nötig

        const tokenResponse = await fetch('https://keycloak.gawron.cloud/realms/webentwicklung/protocol/openid-connect/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!tokenResponse.ok) {
            const err = await tokenResponse.text();
            return res.status(500).send('Token konnte nicht abgerufen werden: ' + err);
        }

        const tokenData = await tokenResponse.json();

        // JWT als Cookie setzen (secure: true für Codespaces!)
        res.cookie('token', tokenData.access_token, { httpOnly: true, sameSite: 'lax', secure: true });
        res.redirect('/');
    } catch (e) {
        res.status(500).send('Fehler beim OAuth-Callback: ' + e.message);
    }
});


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