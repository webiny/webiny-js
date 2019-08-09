import fetch from "cross-fetch";
import { EJSON } from "bson";

class MongoHttpOperationAggregate {
    _params = [];

    constructor({ client, collection, params }) {
        this.client = client;
        this._collection = collection;
        this._params = params;
    }

    toArray() {
        return this.client.execute({
            collection: this._collection,
            operation: {
                name: "aggregate",
                params: this._params
            }
        });
    }
}

class MongoHttpOperationFind {
    _params = [];
    _limit = 0;
    _skip = 0;
    _sort = null;

    constructor({ client, collection, params }) {
        this.client = client;
        this._collection = collection;
        this._params = params;
    }

    limit(value) {
        this._limit = value;
        return this;
    }

    skip(value) {
        this._skip = value;
        return this;
    }

    sort(value) {
        this._sort = value;
        return this;
    }

    toArray() {
        return this.client.execute({
            collection: this._collection,
            operation: {
                name: "find",
                params: this._params
            },
            limit: this._limit,
            skip: this._skip,
            sort: this._sort
        });
    }
}

class MongoHttpCollection {
    constructor(client, name) {
        this.name = name;
        this.client = client;
    }

    find(...args) {
        return new MongoHttpOperationFind({
            client: this.client,
            params: args,
            collection: this.name
        });
    }
    findOne(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "findOne", params: args }
        });
    }
    insert(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "insert", params: args }
        });
    }
    insertOne(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "insertOne", params: args }
        });
    }
    insertMany(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "insertMany", params: args }
        });
    }
    updateMany(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "updateMany", params: args }
        });
    }
    updateOne(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "updateOne", params: args }
        });
    }
    deleteOne(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "deleteOne", params: args }
        });
    }
    deleteMany(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "deleteMany", params: args }
        });
    }
    aggregate(...args) {
        return new MongoHttpOperationAggregate({
            client: this.client,
            params: args,
            collection: this.name
        });
    }
    countDocuments(...args) {
        return this.client.execute({
            collection: this.name,
            operation: { name: "countDocuments", params: args }
        });
    }
}

class MongoHttpClient {
    constructor({ server, databaseName }) {
        this.server = server;
        this.databaseName = databaseName;
    }

    async execute(query) {
        try {
            const payload = EJSON.stringify({
                query,
                database: { server: this.server, name: this.databaseName }
            });

            const res = await fetch(process.env.MONGO_HTTP_SERVER, {
                method: "post",
                body: payload,
                headers: { "Content-Type": "application/json" }
            });

            if (res.status >= 400) {
                throw new Error("Bad response from server");
            }

            const data = await res.text();
            return EJSON.parse(data).result;
        } catch (err) {
            console.log("MongoHttpClient error", err);
        }
    }

    collection(name) {
        return new MongoHttpCollection(this, name);
    }
}

export const createDatabase = ({ server, databaseName }) => {
    return new MongoHttpClient({ server, databaseName });
};
