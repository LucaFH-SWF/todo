import express from 'express';
import api from './api.js';

import path from 'path';
import { fileURLToPath } from 'url';

import { check } from 'express-validator';

import cookieParser from 'cookie-parser';
import passport from './auth.js';

import fetch from 'node-fetch';

import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

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
    check('status')
        .isIn(['open', 'doing', 'done'])
        .withMessage('Status muss "open", "doing" oder "done" sein')
]

const todoValidationRulesUpdate = [
    ...todoValidationRules,
    check('due')
        .isISO8601()
        .toDate()
        .withMessage('Fälligkeitsdatum muss ein gültiges Datum sein'),
    check('_id')
        .exists()
];

const todoValidationRulesInsert = [
    ...todoValidationRules,
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
    check('_id')
        .not()
        .exists()
        .withMessage('_id darf beim Anlegen nicht gesetzt sein')
];

//swagger middleware
const PORT = process.env.PORT || 3000;
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Todo API',
            version: '1.0.0',
            description: 'Todo API Dokumentation',
        },
        servers: [
            {
                url: `https://${process.env.CODESPACE_NAME}-${PORT}.app.github.dev`,
            },
        ],
        components: {
            schemas: {
                Todo: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string',
                            description: 'Titel des Todos',
                            example: 'Neues Todo'
                        },
                        text: {
                            type: 'string',
                            description: 'Beschreibung oder Text des Todos',
                            default: ''
                        },
                        due: {
                            type: 'string',
                            description: 'Fälligkeitsdatum des Todos (ISO 8601 Datum als String)',
                            example: '2025-12-31T23:59:59.000Z'
                        },
                        status: {
                            type: 'string',
                            enum: ['open', 'doing', 'done'],
                            description: 'Status des Todos: open, doing oder done',
                            default: 'open'
                        },
                    },
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                }
            },
        },
        security: [
            {
                bearerAuth: []
            }
        ],
    },
    apis: ['./index.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * Alle Todos abrufen
 * 
 * @swagger
 * /api/todos:
 *   get:
 *     summary: Alle Todos abrufen
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste aller Todos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht autorisiert
 */
app.get('/api/todos', passport.authenticate('jwt', { session: false }), api.getTodos);

/**
 * ein ToDo abrufen
 * 
 * @swagger
 * /api/todos/{id}:
 *   get:
 *     summary: Ein Todo abrufen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ein Todo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Todo'
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht autorisiert
 */
app.get('/api/todos/:id', passport.authenticate('jwt', { session: false }), api.getTodo);

/**
 *  Neues ToDo anlegen
 * 
 * @swagger
 * /api/todos:
 *   post:
 *     summary: Neues Todo anlegen
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Todo'
 *     responses:
 *       201:
 *         description: Todo wurde erstellt
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht autorisiert
 */
app.post('/api/todos', passport.authenticate('jwt', { session: false }), todoValidationRulesInsert, api.newTodo);

/**
 * ToDo aktualisieren
 * 
 * @swagger
 * /api/todos/{id}:
 *   put:
 *     summary: Todo aktualisieren
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Todo'
 *     responses:
 *       200:
 *         description: Todo wurde aktualisiert
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht autorisiert
 */
app.put('/api/todos/:id', passport.authenticate('jwt', { session: false }), todoValidationRulesUpdate, api.updateTodo);

/**
 * ToDo löschen
 * 
 * @swagger
 * /api/todos/{id}:
 *   delete:
 *     summary: Todo löschen
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Todo wurde gelöscht
 *       400:
 *         description: Ungültige Eingabe
 *       401:
 *         description: Nicht autorisiert
 */
app.delete('/api/todos/:id', passport.authenticate('jwt', { session: false }), api.deleteTodo);

app.get('/oauth_callback', async (req, res) => {
    try {
        const code = req.query.code;
        const HOST = `${process.env.CODESPACE_NAME}-${PORT}.app.github.dev`;
        const REDIRECT_URI = `https://${HOST}/oauth_callback`;

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', REDIRECT_URI);
        params.append('client_id', 'todo-backend');

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

        // JWT als Cookie setzen
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
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}/todo.html`);
});