import DB from './db.js';

import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'geheimnis';

const db = new DB();
await db.connect();

const api = {

    // Alle ToDos abrufen
    getTodos: async function (req, res) {
        const todos = await db.queryAll(req);
        if (!todos || todos.length === 0) {
            return res.status(404).json({ error: 'Keine ToDos gefunden' });
        }
        res.json(todos);
    },

    // ein ToDo abrufen
    getTodo: async function (req, res) {
        const id = req.params.id;
        let todo = null;
        try {
            todo = await db.queryById(req,id);
        } catch (err) {
            if (err.message === 'Todo not found') {
                return res.status(404).json({ error: 'ToDo nicht gefunden' });
            } else if (err.status === 403) {
                return res.status(403).json({ error: 'Zugriff verweigert' });
            } else {
                return res.status(500).json({ error: 'Interner Serverfehler' });
            }
        }
        res.json(todo);
    },
    
    // Neues ToDo anlegen
    newTodo: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { title, due, status, text } = req.body;
        const newTodo = {
            title,
            due,
            text,
            status: status ?? 'open',
            userId: req.user.sub
        };
        const inserted = await db.insert(newTodo);
        if (!inserted) {
            return res.status(500).json({ error: 'Fehler beim Anlegen des ToDos' });
        }
        res.status(201).json(inserted);
    },
    
    // ToDo aktualisieren
    updateTodo: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        let { title, due, text, status } = req.body;

        const id = req.params.id;

        let updated = null;
        
        try{
            updated = await db.update(req, id, { title, due, text, status});
        } catch (err) {
            if (err.status === 404) {
                return res.status(404).json({ error: 'ToDo nicht gefunden' });
            } else if (err.status === 403) {
                return res.status(403).json({ error: 'Zugriff verweigert' });
            } else {
                return res.status(500).json({ error: 'Interner Serverfehler' });
            }
        }
        

        if (updated.modifiedCount > 0) {
            const todo = await db.queryById(req, id);
            res.json(todo);
        } else {
            res.status(404).json({ error: 'ToDo nicht gefunden' });
        }
    },
    
    // ToDo löschen
    deleteTodo: async function(req, res) {
        const id = req.params.id;

        let result = null;

        try{
            result = await db.delete(req, id);
        } catch (err) {
            if (err.status === 404) {
                return res.status(404).json({ error: 'ToDo nicht gefunden' });
            } else if (err.status === 403) {
                return res.status(403).json({ error: 'Zugriff verweigert' });
            } else {
                return res.status(500).json({ error: 'Interner Serverfehler' });
            }
        }
        
        if (result && result.deletedCount > 0) {
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'ToDo nicht gefunden' });
        }
    },

    
}

export default api;