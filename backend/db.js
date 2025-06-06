import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todos';
const MONGO_DB = process.env.MONGO_DB || 'todos';

let db = null;
let collection = null;
export default class DB {
    connect() {
        return MongoClient.connect(MONGO_URI)
            .then(function (client) {
                db = client.db(MONGO_DB);
                collection = db.collection('todos');
            })
    }

    queryAll() {
        return collection.find().toArray();
    }

    queryById(id) {
        return collection.findOne({ _id: new ObjectId(id) });
    }

    update(id, order) {
        return collection.replaceOne({ _id: new ObjectId(id) }, order)
    }

    delete(id) {
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