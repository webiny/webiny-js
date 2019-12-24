// @flow
import isId from "./isId";
import generateId from "./generateId";
import { createPaginationMeta } from "@commodo/fields-storage";
import { getName } from "@commodo/name";
import LambdaClient from "aws-sdk/clients/lambda";
import { EJSON } from "bson";

class DbProxyClient {
    constructor({ dbProxyFunctionName }) {
        this.dbProxyFunctionName = dbProxyFunctionName;
    }

    async runOperation(requestPayload) {
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        let { Payload } = await Lambda.invoke({
            FunctionName: this.dbProxyFunctionName,
            Payload: JSON.stringify({ body: EJSON.stringify(requestPayload) })
        }).promise();

        try {
            console.log("dobeooo", Payload);
            Payload = JSON.parse(Payload);
        } catch (e) {
            throw new Error("Could not JSON.parse DB Proxy's response.");
        }

        if (!Payload.response) {
            throw new Error(`Missing "response" key in received DB Proxy's response.`);
        }

        const { result } = EJSON.parse(Payload.response);
        return result;
    }
}

class DbProxyDriver {
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

        const $facet = {
            results: [{ $skip: clonedOptions.offset }, { $limit: clonedOptions.limit }]
        };

        if (clonedOptions.sort) {
            $facet.results.unshift({ $sort: clonedOptions.sort });
        }

        if (options.meta !== false) {
            $facet.totalCount = [{ $count: "value" }];
        }

        const pipeline = [
            { $match: clonedOptions.query },
            {
                $facet
            }
        ];

        const [results = {}] = await this.client.runOperation({
            collection: this.getCollectionName(model),
            operation: ["aggregate", pipeline]
        });

        if (!Array.isArray(results.results)) {
            results.results = [];
        }

        if (!Array.isArray(results.totalCount)) {
            results.totalCount = [];
        }

        return [
            results.results,
            createPaginationMeta({
                totalCount: results.totalCount[0] ? results.totalCount[0].value : 0,
                page: options.page,
                perPage: options.perPage
            })
        ];
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

    getClient() {
        return this.client;
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
