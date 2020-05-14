import LambdaClient from "aws-sdk/clients/lambda";
import { EJSON } from "bson";

const MONGO_CONNECTION_ERRORS = ["MongoServerSelectionError", "MongoNetworkError"];

class DbProxyClient {
    dbProxyFunction: string;

    constructor({ dbProxyFunction }) {
        this.dbProxyFunction = dbProxyFunction;
    }

    async runOperation(requestPayload) {
        const singleOperation = !Array.isArray(requestPayload);

        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        const { Payload } = await Lambda.invoke({
            FunctionName: this.dbProxyFunction,
            Payload: JSON.stringify({
                body: EJSON.stringify({
                    operations: singleOperation ? [requestPayload] : requestPayload
                })
            })
        }).promise();

        let parsedPayload;

        try {
            parsedPayload = JSON.parse(Payload as string);
        } catch (e) {
            throw new Error("Could not JSON.parse DB Proxy's response.");
        }

        if (parsedPayload.error) {
            if (MONGO_CONNECTION_ERRORS.includes(parsedPayload.error.name)) {
                throw new Error(
                    `Could not connect to the MongoDB server, make sure the connection string is correct and that the database server allows outside connections. Check https://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection for more information.`
                );
            }
            throw new Error(`${parsedPayload.error.name}: ${parsedPayload.error.message}`);
        }

        if (!parsedPayload.response) {
            throw new Error(`Missing "response" key in received DB Proxy's response.`);
        }

        const { results } = EJSON.parse(parsedPayload.response) as any;

        if (singleOperation) {
            return results[0];
        }

        return results;
    }
}

type Item = {
    name: string;
    data: { [key: string]: any };
};

class DbProxyDriver {
    client: DbProxyClient;

    constructor({ dbProxyFunction = process.env.DB_PROXY_FUNCTION } = {}) {
        this.client = new DbProxyClient({ dbProxyFunction });
    }

    async create(items: Item[]) {
        const payload = items.map(({ name, data }) => {
            return {
                collection: this.getCollectionName(name),
                operation: ["insertOne", data]
            };
        });

        await this.client.runOperation(payload);

        return true;
    }

    async update(items: Item[]) {
        const payload = items.map(({ name, data }) => {
            return {
                collection: this.getCollectionName(name),
                operation: ["updateOne", { id: data.id }, { $set: data }]
            };
        });

        await this.client.runOperation(payload);

        return true;
    }

    // eslint-disable-next-line
    async delete(items: Item[]) {
        const payload = items.map(({ name, data }) => {
            return {
                collection: this.getCollectionName(name),
                operation: ["deleteOne", { id: data.id }]
            };
        });

        await this.client.runOperation(payload);

        return true;
    }

    async find({ name, options }) {
        const clonedOptions = { limit: 0, offset: 0, ...options };

        DbProxyDriver.__prepareSearchOption(clonedOptions);

        const results = await this.client.runOperation({
            collection: this.getCollectionName(name),
            operation: [
                "find",
                clonedOptions.query,
                {
                    limit: clonedOptions.limit,
                    sort: clonedOptions.sort,
                    offset: clonedOptions.offset
                }
            ]
        });

        return [!Array.isArray(results) ? [] : results, {}];
    }

    async findOne({ name, options }) {
        const clonedOptions = { ...options };
        DbProxyDriver.__prepareSearchOption(clonedOptions);

        // Get first documents from cursor using each
        const results = await this.client.runOperation({
            collection: this.getCollectionName(name),
            operation: [
                "find",
                clonedOptions.query,
                {
                    limit: 1,
                    sort: clonedOptions.sort
                }
            ]
        });

        return results[0];
    }

    async count({ name, options }) {
        const clonedOptions = { ...options };
        DbProxyDriver.__prepareSearchOption(clonedOptions);

        // Get first documents from cursor using each
        return await this.client.runOperation({
            collection: this.getCollectionName(name),
            operation: ["count", clonedOptions.query]
        });
    }

    getCollectionName(name) {
        return name;
    }

    getClient() {
        return this.client;
    }

    static __prepareSearchOption(options) {
        // Here we handle search (if passed) - we transform received arguments into linked LIKE statements.
        if (options.search && options.search.query) {
            const { query, operator, fields } = options.search;

            const searches = [];
            fields.forEach(field => {
                searches.push({ [field]: { $regex: `.*${query}.*`, $options: "i" } });
            });

            const search = {
                [operator === "and" ? "$and" : "$or"]: searches
            };

            if (options.query instanceof Object) {
                options.query = {
                    $and: [search, options.query]
                };
            } else {
                options.query = search;
            }

            delete options.search;
        }
    }
}

export default DbProxyDriver;
