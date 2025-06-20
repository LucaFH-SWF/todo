import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todos';
const MONGO_DB = process.env.MONGO_DB || 'todos';

let db = null;
let collection = null;

function makeError(msg, status) {
    const err = new Error(msg);
    err.status = status;
    return err;
}

export default class DB {
    connect() {
        return MongoClient.connect(MONGO_URI)
            .then(function (client) {
                db = client.db(MONGO_DB);
                collection = db.collection('todos');
            })
    }

    queryAll(req) {
        let userId = req.user.sub;
        return collection.find({ userId }).toArray();
    }

    async queryById(req, id) {
        let todo = await collection.findOne({ _id: new ObjectId(id) });
        if (!todo) {
            throw new Error('Todo not found');
        }
        if (todo.userId !== req.user.sub) {
            throw makeError('Forbidden', 403);
        }
        return todo;
    }

    async update(req, id, order) {
        let todo = await collection.findOne({ _id: new ObjectId(id) });
            
        if (!todo) {
            const err = new Error('Todo not found');
            err.status = 404;
            throw err;
        }
        if (todo.userId !== req.user.sub) {
            throw makeError('Forbidden', 403);
        }
            
        order.userId = req.user.sub;
        return collection.replaceOne({ _id: new ObjectId(id) }, order)
    }

    async delete(req, id) {
        let todo = await collection.findOne({ _id: new ObjectId(id) });
            
        if (!todo) {
            throw makeError('Todo not found', 404);
        }

        if (todo.userId !== req.user.sub) {
            throw makeError('Forbidden', 403);
        }
            
        return collection.deleteOne({ _id: new ObjectId(id) });
    }

    insert(todo) {
        return collection.insertOne(todo)
        .then(result => {
            todo._id = result.insertedId;
            return todo;
        })
    }
}