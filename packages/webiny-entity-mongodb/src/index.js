// @flow
import _ from "lodash";
import mdbid from "mdbid";
import { EntityModel } from "webiny-entity";
import mongodb from "mongodb";

import { Entity, Driver, QueryResult } from "webiny-entity";

declare type MongoDbDriverOptions = {
    database: Database | Pool,
    model: Class<MongoDbModel>,
    collections: {
        prefix: string,
        naming: ?Function
    }
};

class MongoDbDriver extends Driver {
    database: MongoDbDatabase;
    model: Class<MongoDbModel>;
    collections: {
        prefix: string,
        naming: ?Function
    };

    constructor(options: MongoDbDriverOptions) {
        super();
        this.database = options.database;
        this.model = options.model || EntityModel;

        this.collections = _.merge(
            {
                prefix: "",
                naming: null
            },
            options.collections
        );
    }

    onEntityConstruct(entity: Entity) {
        entity
            .attr("id")
            .char()
            .setValidators((value, attribute) =>
                this.isId(attribute.getParentModel().getParentEntity(), value)
            );
    }

    getModelClass(): Class<MongoDbModel> {
        return this.model;
    }

    // eslint-disable-next-line
    async save(entity: Entity, options: EntitySaveParams & {}): Promise<QueryResult> {
        if (!entity.isExisting()) {
            entity.id = MongoDbDriver.__generateID();

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
    async delete(entity: Entity, options: EntityDeleteParams & {}): Promise<QueryResult> {
        await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .deleteOne({ id: entity.id });
        return new QueryResult(true);
    }

    async find(
        entity: Entity | Class<Entity>,
        options: EntityFindParams & {}
    ): Promise<QueryResult> {
        const clonedOptions = _.merge({}, options, {
            limit: 10,
            offset: 0
        });

        MongoDbDriver.__preparePerPageOption(clonedOptions);
        MongoDbDriver.__preparePageOption(clonedOptions);
        MongoDbDriver.__prepareSearchOption(clonedOptions);

        const results = [];

        // Get first documents from cursor using each
        await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .find(clonedOptions.query)
            .limit(clonedOptions.limit)
            .skip(clonedOptions.offset)
            .sort(clonedOptions.sort)
            .each(function(err, doc) {
                if (err) {
                    throw err;
                }

                if (!doc) {
                    return false;
                }

                results.push(doc);
            });

        const totalCount = await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .count(clonedOptions.query);

        return new QueryResult(results, { totalCount });
    }

    async findOne(
        entity: Entity | Class<Entity>,
        options: EntityFindOneParams & {}
    ): Promise<QueryResult> {
        const clonedOptions = _.clone(options);
        MongoDbDriver.__prepareSearchOption(clonedOptions);

        const result = await this.getDatabase()
            .collection(this.getCollectionName(entity))
            .findOne(clonedOptions.query);

        return new QueryResult(result);
    }

    async count(
        entity: Entity | Class<Entity>,
        options: EntityFindParams & {}
    ): Promise<QueryResult> {
        const clonedOptions = _.clone(options);
        MongoDbDriver.__prepareSearchOption(clonedOptions);

        return new QueryResult(
            await this.getDatabase()
                .collection(this.getCollectionName(entity))
                .count(clonedOptions.query)
        );
    }

    // eslint-disable-next-line
    isId(entity: Entity | Class<Entity>, value: mixed, options: ?Object): boolean {
        if (typeof value === "string") {
            return value.match(new RegExp("^[0-9a-fA-F]{24}$")) !== null;
        }

        return false;
    }

    getDatabase(): MongoDbDatabase {
        return this.database;
    }

    setCollectionPrefix(collectionPrefix: string): this {
        this.collections.prefix = collectionPrefix;
        return this;
    }

    getCollectionPrefix(): string {
        return this.collections.prefix;
    }

    setCollectionNaming(collectionNameValue: Function): this {
        this.collections.naming = collectionNameValue;
        return this;
    }

    getCollectionNaming(): ?Function {
        return this.collections.naming;
    }

    getCollectionName(entity: Entity): string {
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

    static __preparePerPageOption(clonedOptions: Object): void {
        if ("perPage" in clonedOptions) {
            clonedOptions.limit = clonedOptions.perPage;
            delete clonedOptions.perPage;
        }
    }

    static __preparePageOption(clonedOptions: Object): void {
        if ("page" in clonedOptions) {
            clonedOptions.offset = clonedOptions.limit * (clonedOptions.page - 1);
            delete clonedOptions.page;
        }
    }

    static __prepareSearchOption(clonedOptions: Object): void {
        // Here we handle search (if passed) - we transform received arguments into linked LIKE statements.
        if (clonedOptions.search instanceof Object) {
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
