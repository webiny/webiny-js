// @flow
import isId from "./isId";
import generateId from "./generateId";
import { createPaginationMeta } from "@commodo/fields-storage";
import { getName } from "@commodo/name";
import LambdaClient from "aws-sdk/clients/lambda";

class DbProxyClient {
    constructor({ dbProxyFunctionName }) {
        this.dbProxyFunctionName = dbProxyFunctionName;
    }

    runOperation(payload) {
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        return Lambda.invoke({
            FunctionName: this.dbProxyFunctionName,
            Payload: JSON.stringify(payload)
        }).promise();
    }
}

class DbProxyDriver {
    collections: Object;
    client: DbProxyClient;
    constructor({ dbProxyFunctionName = process.env.DB_PROXY_FUNCTION_NAME } = {}) {
        this.client = new DbProxyClient({ dbProxyFunctionName });
    }

    // eslint-disable-next-line
    async save({ model, isCreate }) {
        return isCreate ? this.create({ model }) : this.update({ model });
    }

    async create({ model }: Object) {
        if (!model.id) {
            model.id = generateId();
        }

        const data = await model.toStorage();

        try {
            await this.client.runOperation({
                collection: this.getCollectionName(model),
                operation: ["insertOne", data]
            });
            return true;
        } catch (e) {
            model.id && model.getField("id").reset();
            throw e;
        }
    }

    async update({ model }: Object) {
        const data = await model.toStorage();
        await this.client.runOperation({
            collection: this.getCollectionName(model),
            operation: ["updateOne", { id: model.id }, { $set: data }]
        });

        return true;
    }

    // eslint-disable-next-line
    async delete({ model }) {
        await this.client.runOperation({
            collection: this.getCollectionName(model),
            operation: ["deleteOne", { id: model.id }]
        });
        return true;
    }

    async find({ model, options }) {
        const clonedOptions = { limit: 10, offset: 0, ...options };

        DbProxyDriver.__preparePerPageOption(clonedOptions);
        DbProxyDriver.__preparePageOption(clonedOptions);
        DbProxyDriver.__prepareSearchOption(clonedOptions);

        // Get first documents from cursor using each
        const results = await this.client.runOperation({
            collection: this.getCollectionName(model),
            operation: [
                "find",
                clonedOptions.query,
                {
                    limit: clonedOptions.limit,
                    offset: clonedOptions.offset,
                    sort: clonedOptions.sort
                }
            ]
        });

        if (options.meta === false) {
            return [results, {}];
        }

        const totalCount = await this.client.runOperation({
            collection: this.getCollectionName(model),
            operation: ["count", clonedOptions.query]
        });

        const meta = createPaginationMeta({
            totalCount,
            page: options.page,
            perPage: options.perPage
        });

        return [results, meta];
    }

    async findOne({ model, options }) {
        const clonedOptions = { ...options };
        DbProxyDriver.__preparePerPageOption(clonedOptions);
        DbProxyDriver.__preparePageOption(clonedOptions);
        DbProxyDriver.__prepareSearchOption(clonedOptions);

        // Get first documents from cursor using each
        const results = await this.client.runOperation({
            collection: this.getCollectionName(model),
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

    async count({ model, options }) {
        const clonedOptions = { ...options };
        DbProxyDriver.__prepareSearchOption(clonedOptions);

        // Get first documents from cursor using each
        return await this.client.runOperation({
            collection: this.getCollectionName(model),
            operation: ["count", clonedOptions.query]
        });
    }

    isId(value: any): boolean {
        return isId(value);
    }

    getCollectionName(model) {
        return getName(model);
    }

    static __preparePerPageOption(options: Object) {
        if ("perPage" in options) {
            options.limit = options.perPage;
            delete options.perPage;
        }
    }

    static __preparePageOption(options: Object) {
        if ("page" in options) {
            options.offset = options.limit * (options.page - 1);
            delete options.page;
        }
    }

    static __prepareSearchOption(options: Object) {
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
