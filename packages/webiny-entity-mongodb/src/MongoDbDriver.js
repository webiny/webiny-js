// @flow
import merge from "lodash/merge";
import clone from "lodash/clone";
import mdbid from "mdbid";
import { EntityModel } from "webiny-entity";
import mongodb from "mongodb";

import { Driver, QueryResult, createPaginationMeta } from "webiny-entity";

class MongoDbDriver extends Driver {
    constructor(options) {
        super();
        this.database = options.database;
        this.model = options.model || EntityModel;

        this.collections = merge(
            {
                prefix: "",
                naming: null
            },
            options.collections
        );
    }

    onEntityConstruct(entity) {
        entity
            .attr("id")
            .char()
            .setValidators((value, attribute) =>
                this.isId(attribute.getParentModel().getParentEntity(), value)
            );
    }

    getModelClass() {
        return this.model;
    }

    /**
     * Note: collection name must be passed because entity from which it's called cannot be determined.
     * @returns {Promise<*>}
     * @param collection
     * @param pipeline
     */
    async aggregate(collection, pipeline) {
        return await this.getDatabase()
            .collection(collection)
            .aggregate(pipeline)
            .toArray();
    }

    // eslint-disable-next-line
    async save(entity) {
        if (!entity.isExisting()) {
            if (!entity.id) {
                entity.id = MongoDbDriver.__generateID();
            }

            const data = await entity.toStorage();
            data._id = new mongodb.ObjectID(entity.id);

            try {
                await this.getDatabase()
                    .collection(this.getCollectionName(entity))
                    .insertOne(data);
                return new QueryResult(true);
            } catch (e) {
                entity.id && entity.getAttribute("id").reset();
                throw e;
            }
        }

        const data = await entity.toStorage();

        await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .updateOne({ id: entity.id }, { $set: data });

        return new QueryResult(true);
    }

    // eslint-disable-next-line
    async delete(entity, options) {
        await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .deleteOne({ id: entity.id });
        return new QueryResult(true);
    }

    async find(entity, options) {
        if (options.aggregation) {
            if (typeof options.aggregation === "function") {
                return options.aggregation({
                    aggregate: async pipeline => {
                        return await this.getDatabase()
                            .collection(this.getCollectionName(entity))
                            .aggregate(pipeline)
                            .toArray();
                    },
                    QueryResult
                });
            }

            // Get first documents from cursor using each
            const results = await this.getDatabase()
                .collection(this.getCollectionName(entity))
                .aggregate(options.aggregation)
                .toArray();

            return new QueryResult(results);
        }

        const clonedOptions = merge({}, options, {
            limit: 10,
            offset: 0
        });

        MongoDbDriver.__preparePerPageOption(clonedOptions);
        MongoDbDriver.__preparePageOption(clonedOptions);
        MongoDbDriver.__prepareSearchOption(clonedOptions);

        // Get first documents from cursor using each
        const results = await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .find(clonedOptions.query)
            .limit(clonedOptions.limit)
            .skip(clonedOptions.offset)
            .sort(clonedOptions.sort)
            .toArray();

        const totalCount = await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .countDocuments(clonedOptions.query);

        const meta = createPaginationMeta({
            totalCount,
            page: options.page,
            perPage: options.perPage
        });

        return new QueryResult(results, meta);
    }

    async findOne(entity, options) {
        const clonedOptions = clone(options);
        MongoDbDriver.__preparePerPageOption(clonedOptions);
        MongoDbDriver.__preparePageOption(clonedOptions);
        MongoDbDriver.__prepareSearchOption(clonedOptions);

        const results = await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .find(clonedOptions.query)
            .limit(1)
            .sort(clonedOptions.sort)
            .toArray();

        return new QueryResult(results[0]);
    }

    async count(entity, options) {
        const clonedOptions = clone(options);
        MongoDbDriver.__prepareSearchOption(clonedOptions);

        return new QueryResult(
            await this.getDatabase()
                .collection(this.getCollectionName(entity))
                .countDocuments(clonedOptions.query)
        );
    }

    // eslint-disable-next-line
    isId(entity, value) {
        if (typeof value === "string") {
            return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
        }

        return false;
    }

    getDatabase() {
        return this.database;
    }

    setCollectionPrefix(collectionPrefix) {
        this.collections.prefix = collectionPrefix;
        return this;
    }

    getCollectionPrefix() {
        return this.collections.prefix;
    }

    setCollectionNaming(collectionNameValue) {
        this.collections.naming = collectionNameValue;
        return this;
    }

    getCollectionNaming() {
        return this.collections.naming;
    }

    getCollectionName(entity) {
        const isClass = typeof entity === "function";
        const params = {
            classId: isClass ? entity.classId : entity.constructor.classId,
            collectionName: isClass ? entity.collectionName : entity.constructor.collectionName
        };

        const getCollectionName = this.getCollectionNaming();
        if (typeof getCollectionName === "function") {
            return getCollectionName({ entity, ...params, driver: this });
        }

        if (params.collectionName) {
            return this.collections.prefix + params.collectionName;
        }

        return this.collections.prefix + params.classId;
    }

    static __preparePerPageOption(clonedOptions) {
        if ("perPage" in clonedOptions) {
            clonedOptions.limit = clonedOptions.perPage;
            delete clonedOptions.perPage;
        }
    }

    static __preparePageOption(clonedOptions) {
        if ("page" in clonedOptions) {
            clonedOptions.offset = clonedOptions.limit * (clonedOptions.page - 1);
            delete clonedOptions.page;
        }
    }

    static __prepareSearchOption(clonedOptions) {
        // Here we handle search (if passed) - we transform received arguments into linked LIKE statements.
        if (clonedOptions.search && clonedOptions.search.query) {
            const { query, operator, fields } = clonedOptions.search;

            const searches = [];
            fields.forEach(field => {
                searches.push({ [field]: { $regex: `.*${query}.*`, $options: "i" } });
            });

            const search = {
                [operator === "and" ? "$and" : "$or"]: searches
            };

            if (clonedOptions.query instanceof Object) {
                clonedOptions.query = {
                    $and: [search, clonedOptions.query]
                };
            } else {
                clonedOptions.query = search;
            }

            delete clonedOptions.search;
        }
    }

    static __generateID() {
        return mdbid();
    }
}

export default MongoDbDriver;
