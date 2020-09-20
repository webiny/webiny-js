import { EJSON } from "bson";
import { HandlerClientContext } from "@webiny/handler-client/types";

const MONGO_CONNECTION_ERRORS = ["MongoServerSelectionError", "MongoNetworkError"];

class DbProxyClient {
    dbProxyFunction: string;
    context: HandlerClientContext;

    constructor({ dbProxyFunction, context }) {
        this.dbProxyFunction = dbProxyFunction;
        this.context = context;
    }

    async runOperation(requestPayload) {
        const singleOperation = !Array.isArray(requestPayload);

        const data = await this.context.handlerClient.invoke({
            name: this.dbProxyFunction,
            payload: {
                body: EJSON.stringify({
                    operations: singleOperation ? [requestPayload] : requestPayload
                })
            }
        });

        if (data.error) {
            console.log("[commodo-fields-storage-db-proxy error:]", data.error);
            if (MONGO_CONNECTION_ERRORS.includes(data.error.name)) {
                throw new Error(
                    `Could not connect to the MongoDB server, make sure the connection string is correct and that the database server allows outside connections. Check https://docs.webiny.com/docs/get-started/quick-start#3-setup-database-connection for more information.`
                );
            }
            throw new Error(`${data.error.name}: ${data.error.message}`);
        }

        console.log('ovo govno', data)
        if (!data.response) {
            throw new Error(`Missing "response" key in received DB Proxy's response.`);
        }

        const { results } = EJSON.parse(data.response) as any;

        if (singleOperation) {
            return results[0];
        }

        return results;
    }
}

type Item = {
    name: string;
    query: { [key: string]: any };
    data: { [key: string]: any };
};

class DbProxyDriver {
    client: DbProxyClient;

    constructor({
        dbProxyFunction,
        context
    }: {
        dbProxyFunction: string;
        context: HandlerClientContext;
    }) {
        this.client = new DbProxyClient({ context, dbProxyFunction });
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
        const payload = items.map(({ name, query, data }) => {
            return {
                collection: this.getCollectionName(name),
                operation: ["updateOne", query, { $set: data }]
            };
        });

        await this.client.runOperation(payload);

        return true;
    }

    async delete({ name, options }) {
        const clonedOptions = { ...options };

        DbProxyDriver.__prepareSearchOption(clonedOptions);

        await this.client.runOperation({
            collection: this.getCollectionName(name),
            operation: ["deleteMany", clonedOptions.query]
        });

        return true;
    }

    async find({ name, options }) {
        const clonedOptions = { limit: 0, offset: 0, ...options };

        DbProxyDriver.__prepareSearchOption(clonedOptions);
        DbProxyDriver.__prepareProjectFields(clonedOptions);

        const results = await this.client.runOperation({
            collection: this.getCollectionName(name),
            operation: [
                "find",
                clonedOptions.query,
                {
                    limit: clonedOptions.limit,
                    sort: clonedOptions.sort,
                    offset: clonedOptions.offset,
                    project: clonedOptions.project
                }
            ]
        });

        return [!Array.isArray(results) ? [] : results, {}];
    }

    async findOne({ name, options }) {
        const clonedOptions = { ...options };
        DbProxyDriver.__prepareSearchOption(clonedOptions);
        DbProxyDriver.__prepareProjectFields(clonedOptions);

        // Get first documents from cursor using each
        const results = await this.client.runOperation({
            collection: this.getCollectionName(name),
            operation: [
                "find",
                clonedOptions.query,
                {
                    limit: 1,
                    sort: clonedOptions.sort,
                    project: clonedOptions.project
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

    static __prepareProjectFields(options) {
        // Here we convert requested fields into a "project" parameter
        if (options.fields) {
            options.project = options.fields.reduce(
                (acc, item) => {
                    acc[item] = 1;
                    return acc;
                },
                { id: 1 }
            );

            delete options.fields;
        }
    }
}

export default DbProxyDriver;
