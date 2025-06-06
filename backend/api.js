import DB from './db.js';

const db = new DB();
await db.connect();

const api = {

    // Alle ToDos abrufen
    getTodos: async function (req, res) {
        const todos = await db.queryAll();
        if (!todos || todos.length === 0) {
            return res.status(404).json({ error: 'Keine ToDos gefunden' });
        }
        res.json(todos);
    },

    // ein ToDo abrufen
    getTodo: async function (req, res) {
        const id = req.params.id;
        const todo = await db.queryById(id);
        if (!todo) {
            return res.status(404).json({ error: 'ToDo nicht gefunden' });
        }
        res.json(todo);
    },
    
    // Neues ToDo anlegen
    newTodo: async function(req, res) {
        const { title, due, status } = req.body;
        const newTodo = {
            title,
            due,
            status: status ?? 'open'
        };
        const inserted = await db.insert(newTodo);
        if (!inserted) {
            return res.status(500).json({ error: 'Fehler beim Anlegen des ToDos' });
        }
        res.json(inserted);
    },
    
    // ToDo aktualisieren
    updateTodo: async function(req, res) {
        const id = req.params.id;
        const updated = await db.update(id, req.body);
        if (updated.modifiedCount > 0) {
            const todo = await db.queryById(id);
            res.json(todo);
        } else {
            res.status(404).json({ error: 'ToDo nicht gefunden' });
        }
    },
    
    // ToDo löschen
    deleteTodo: async function(req, res) {
        const id = req.params.id;
        const result = await db.delete(id);
        if (result.deletedCount > 0) {
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'ToDo nicht gefunden' });
        }
    }
}

export default api;