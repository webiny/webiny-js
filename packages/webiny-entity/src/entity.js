// @flow
import _ from "lodash";
import { Attribute } from "webiny-model";
import Driver from "./driver";
import EntityPool from "./entityPool";
import EventHandler from "./eventHandler";
import EntityCollection from "./entityCollection";
import EntityModel from "./entityModel";
import EntityAttributesContainer from "./entityAttributesContainer";
import QueryResult from "./queryResult";
import { EntityError } from "./index";

class Entity {
    static classId: string;
    static storageClassId: string;
    static driver: Driver;
    static pool: EntityPool;
    static listeners: {};
    static crud: {
        logs?: boolean,
        delete?: {
            soft?: boolean
        }
    };
    classId: string;
    storageClassId: string;
    id: string;
    model: EntityModel;
    listeners: {};
    existing: boolean;
    processing: ?string;
    createdOn: ?Date;
    updatedOn: ?Date;
    savedOn: ?Date;
    deleted: ?boolean;
    constructor(): Entity {
        const proxy = new Proxy((this: Object), {
            set: (instance, key, value) => {
                const attribute: ?Attribute = instance.getModel().getAttribute(key);
                if (attribute) {
                    attribute.setValue(value);
                    return true;
                }

                instance[key] = value;
                return true;
            },
            get: (instance, key) => {
                if (["classId", "storageClassId", "driver"].includes(key)) {
                    return instance.constructor[key];
                }

                const attribute: ?Attribute = instance.getModel().getAttribute(key);
                if (attribute) {
                    return attribute.getValue();
                }

                return instance[key];
            }
        });

        const modelClass = this.getDriver().getModelClass();
        if (!modelClass) {
            throw new EntityError("Entity model is missing.", EntityError.MODEL_MISSING);
        }

        this.model = new modelClass().setParentEntity(proxy);

        this.listeners = {};
        this.existing = false;
        this.processing = null;

        if (_.get(this, "constructor.crud.logs")) {
            this.attr("savedOn")
                .date()
                .setSkipOnPopulate();
            this.attr("createdOn")
                .date()
                .setSkipOnPopulate();
            this.attr("updatedOn")
                .date()
                .setSkipOnPopulate();
        }

        const deletes = _.get(this, "constructor.crud.delete", {});
        if (deletes.soft) {
            this.attr("deleted")
                .boolean()
                .setSkipOnPopulate()
                .setValue(false);

            this.on("beforeDelete", () => (proxy.deleted = true));
        }

        this.on("delete", () => {
            if (!proxy.id) {
                throw new EntityError(
                    "Entity cannot be deleted because it was not previously saved.",
                    EntityError.CANNOT_DELETE_NO_ID
                );
            }
        });

        this.getDriver().onEntityConstruct(proxy);

        if (!this.getAttribute("id")) {
            this.attr("id").char();
        }

        return proxy;
    }

    /**
     * Returns instance of entity's model.
     */
    getModel(): EntityModel {
        return this.model;
    }

    /**
     * Returns instance of used driver.
     */
    static getDriver(): Driver {
        return this.driver;
    }

    /**
     * Returns instance of used driver.
     */
    getDriver(): Driver {
        return this.constructor.driver;
    }

    /**
     * Returns instance of used entity pool.
     */
    static getEntityPool(): EntityPool {
        return this.pool;
    }

    /**
     * Returns instance of used entity pool.
     */
    getEntityPool(): EntityPool {
        return this.constructor.pool;
    }

    /**
     * Sets whether entity is existing or not.
     */
    setExisting(flag: boolean = true): this {
        this.existing = flag;
        return this;
    }

    /**
     * Returns true if entity exists or in other words, is already saved in storage. Otherwise returns false.
     */
    isExisting(): boolean {
        return this.existing;
    }

    /**
     * Creates new attribute with name.
     */
    attr(name: string) {
        const container: EntityAttributesContainer = (this.getModel().getAttributesContainer(): any);
        return container.attr(name);
    }

    /**
     * Returns single attribute by given name.
     */
    getAttribute(name: string): ?Attribute {
        return this.getModel().getAttribute(name);
    }

    /**
     * Returns all entity's attributes.
     */
    getAttributes(): { [string]: Attribute } {
        return this.getModel().getAttributes();
    }

    async get(path: string | Array<string> = "", defaultValue?: mixed) {
        return this.getModel().get(path, defaultValue);
    }

    async set(path: string, value: mixed) {
        return this.getModel().set(path, value);
    }

    /**
     * Returns entity's JSON representation.
     */
    async toJSON(path: ?string): Promise<JSON> {
        const attribute: Attribute = (this.getAttribute("id"): any);
        return _.merge(
            { id: attribute.getValue() },
            path ? await this.getModel().toJSON(path) : {}
        );
    }

    /**
     * Returns data suitable for storage.
     */
    async toStorage(): Promise<{}> {
        return this.getModel().toStorage();
    }

    /**
     * Validates current entity and throws exception that contains all invalid attributes.
     */
    async validate(): Promise<void> {
        await this.emit("beforeValidate");
        await this.getModel().validate();
        await this.emit("afterValidate");
    }

    /**
     * Used to populate entity with given data.
     */
    populate(data: Object): this {
        this.getModel().populate(data);
        return this;
    }

    /**
     * Used when populating entity with data from storage.
     * @param data
     */
    populateFromStorage(data: Object): this {
        this.getModel().populateFromStorage(data);
        return this;
    }

    /**
     * Returns class name.
     */
    getClassName(): string {
        return this.constructor.name;
    }

    /**
     * Returns class name.
     */
    static getClassName(): string {
        return this.name;
    }

    /**
     * Tells us whether a given ID is valid or not.
     * @param id
     * @param params
     */
    isId(id: mixed, params: Object = {}): boolean {
        return this.getDriver().isId(this, id, _.cloneDeep(params));
    }

    /**
     * Tells us whether a given ID is valid or not.
     * @param id
     * @param params
     */
    static isId(id: mixed, params: Object = {}): boolean {
        return this.getDriver().isId(this, id, _.cloneDeep(params));
    }

    /**
     * Saves current and all linked entities (if autoSave on the attribute was enabled).
     * @param params
     */
    async save(params: ?Object): Promise<void> {
        if (!params) {
            params = {};
        }
        const events = params.events || {};
        const existing = this.isExisting();

        events.beforeSave !== false && (await this.emit("beforeSave", { params }));

        if (existing) {
            events.beforeUpdate !== false && (await this.emit("beforeUpdate", { params }));
        } else {
            events.beforeCreate !== false && (await this.emit("beforeCreate", { params }));
        }

        if (this.processing) {
            return;
        }

        this.processing = "save";
        const logs = _.get(this, "constructor.crud.logs");

        try {
            events.save !== false && (await this.emit("__save", { params }));
            if (existing) {
                events.update !== false && (await this.emit("__update", { params }));
            } else {
                events.create !== false && (await this.emit("__create", { params }));
            }

            params.validation !== false && (await this.validate());

            events.__beforeSave !== false && (await this.emit("__beforeSave", { params }));

            if (existing) {
                events.__beforeUpdate !== false && (await this.emit("__beforeUpdate", { params }));
                if (logs && this.isDirty()) {
                    this.savedOn = new Date();
                    this.updatedOn = new Date();
                }
            } else {
                events.__beforeCreate !== false && (await this.emit("__beforeCreate", { params }));
                if (logs && this.isDirty()) {
                    this.savedOn = new Date();
                    this.createdOn = new Date();
                }
            }

            if (this.isDirty()) {
                await this.getDriver().save(this, params);
            }

            events.__afterSave !== false && (await this.emit("__afterSave", { params }));
            if (existing) {
                events.__afterUpdate !== false && (await this.emit("__afterUpdate", { params }));
            } else {
                events.__afterCreate !== false && (await this.emit("__afterCreate", { params }));
            }

            this.setExisting();
            this.getModel().clean();

            this.getEntityPool().add(this);
        } catch (e) {
            throw e;
        } finally {
            this.processing = null;
        }

        events.afterSave !== false && (await this.emit("afterSave", { params }));
        if (existing) {
            events.afterUpdate !== false && (await this.emit("afterUpdate", { params }));
        } else {
            events.afterCreate !== false && (await this.emit("afterCreate", { params }));
        }
    }

    /**
     * Deletes current and all linked entities (if autoDelete on the attribute was enabled).
     * @param params
     */
    async delete(params: ?Object): Promise<void> {
        if (this.processing) {
            return;
        }

        this.processing = "delete";

        const soft = _.get(this, "constructor.crud.delete.soft");

        if (!params) {
            params = {};
        }

        try {
            const events = params.events || {};
            events.delete !== false && (await this.emit("delete", { params }));

            params.validation !== false && (await this.validate());

            events.beforeDelete !== false && (await this.emit("beforeDelete", { params }));

            const logs = _.get(this, "constructor.crud.logs");
            if (logs) {
                this.savedOn = new Date();
                this.updatedOn = new Date();
            }

            if (soft && params.permanent !== true) {
                await this.getDriver().save(this, params);
            } else {
                await this.getDriver().delete(this, params);
            }
            events.afterDelete !== false && (await this.emit("afterDelete", { params }));

            this.getEntityPool().remove(this);
        } catch (e) {
            throw e;
        } finally {
            this.processing = null;
        }
    }

    /**
     * Finds a single entity matched by given ID.
     * @param id
     * @param params
     */
    static async findById(id: mixed, params: ?Object): Promise<null | Entity> {
        if (!id) {
            return null;
        }

        const pooled = this.getEntityPool().get(this, id);
        if (pooled) {
            return pooled;
        }

        if (!params) {
            params = {};
        }

        const newParams = _.merge(_.cloneDeep(params), { query: { id } });
        return await this.findOne(newParams);
    }

    /**
     * Finds one or more entities matched by given IDs.
     * @param ids
     * @param params
     */
    static async findByIds(ids: Array<mixed>, params: ?Object): Promise<Array<Entity>> {
        const output = [];
        for (let i = 0; i < ids.length; i++) {
            const entity = await this.findById(ids[i], params);
            if (entity) {
                output.push(entity);
            }
        }

        return output;
    }

    /**
     * Finds one entity matched by given query parameters.
     * @param params
     */
    static async findOne(params: ?Object): Promise<null | Entity> {
        if (!params) {
            params = {};
        }

        const prepared = this.__prepareParams(params);
        await this.emit("query", prepared);

        const queryResult = await this.getDriver().findOne(this, prepared);
        const result = queryResult.getResult();
        if (_.isObject(result)) {
            const pooled = this.getEntityPool().get(this, result.id);
            if (pooled) {
                await pooled.emit("read", { params });
                return pooled;
            }

            const entity = new this().setExisting().populateFromStorage(((result: any): Object));
            await entity.emit("read", { params });
            this.getEntityPool().add(entity);
            return entity;
        }
        return null;
    }

    /**
     * Finds one or more entities matched by given query parameters.
     * @param params
     */
    static async find(params: ?Object): Promise<EntityCollection> {
        if (!params) {
            params = {};
        }

        const prepared = this.__prepareParams(params);

        // Prepare find-specific params: perPage and page.
        prepared.page = Number(prepared.page);
        if (!Number.isInteger(prepared.page) || prepared.page <= 0) {
            prepared.page = 1;
        }

        prepared.perPage = Number(prepared.perPage);
        if (Number.isInteger(prepared.perPage) && prepared.perPage > 0) {
            if (prepared.perPage > 100) {
                throw new EntityError(
                    "Cannot query for more than 100 entities per page.",
                    EntityError.CANNOT_QUERY_MORE_THAN_100
                );
            }
        } else {
            prepared.perPage = 10;
        }

        await this.emit("query", prepared);

        const queryResult: QueryResult = await this.getDriver().find(this, prepared);
        const entityCollection = new EntityCollection()
            .setParams(prepared)
            .setMeta(queryResult.getMeta());
        const result: Array<Object> = (queryResult.getResult(): any);
        if (result instanceof Array) {
            for (let i = 0; i < result.length; i++) {
                const pooled = this.getEntityPool().get(this, result[i].id);
                if (pooled) {
                    entityCollection.push(pooled);
                    await pooled.emit("read", { params });
                } else {
                    const entity = new this().setExisting().populateFromStorage(result[i]);
                    await entity.emit("read", { params });
                    this.getEntityPool().add(entity);
                    entityCollection.push(entity);
                }
            }
        }

        return entityCollection;
    }

    /**
     * Counts total number of entities matched by given query parameters.
     * @param params
     */
    static async count(params: ?Object): Promise<number> {
        if (!params) {
            params = {};
        }

        const prepared = this.__prepareParams(params);
        await this.emit("query", prepared);

        const queryResult: QueryResult = await this.getDriver().count(this, prepared);
        return ((queryResult.getResult(): any): number);
    }

    /**
     * Registers a listener that will be triggered only on current entity instance.
     * @param name
     * @param callback
     */
    on(name: string, callback: Function): EventHandler {
        const eventHandler = new EventHandler(name, callback);
        if (!this.listeners[eventHandler.getName()]) {
            this.listeners[eventHandler.getName()] = [];
        }
        this.listeners[eventHandler.getName()].push(eventHandler);
        return eventHandler;
    }

    /**
     * Registers a listener that will be triggered on all entity instances of current class.
     * @param name
     * @param callback
     */
    static on(name: string, callback: Function): EventHandler {
        if (!this.listeners) {
            this.listeners = {};
        }

        const eventHandler = new EventHandler(name, callback);
        if (!this.listeners[eventHandler.getName()]) {
            this.listeners[eventHandler.getName()] = [];
        }
        this.listeners[eventHandler.getName()].push(eventHandler);
        return eventHandler;
    }

    /**
     * Emits an event, which will trigger both static and instance listeners.
     * @param name
     * @param data
     */
    async emit(name: string, data: Object = {}): Promise<this> {
        if (this.listeners[name]) {
            for (let i = 0; i < this.listeners[name].length; i++) {
                await this.listeners[name][i].execute({ ...data, entity: this });
            }
        }

        if (this.constructor.listeners) {
            if (this.constructor.listeners[name]) {
                for (let i = 0; i < this.constructor.listeners[name].length; i++) {
                    await this.constructor.listeners[name][i].execute({ ...data, entity: this });
                }
            }
        }
        return this;
    }

    /**
     * Emits an event, which will trigger static event listeners.
     * @param name
     * @param data
     */
    static async emit(name: string, data: Object = {}): Promise<void> {
        if (_.get(this, "listeners." + name)) {
            for (let i = 0; i < this.listeners[name].length; i++) {
                await this.listeners[name][i].execute({ ...data, entity: this });
            }
        }
    }

    isDirty(): boolean {
        return this.getModel().isDirty();
    }

    isClean(): boolean {
        return !this.isDirty();
    }

    /**
     * Returns information about the entity.
     * @returns {{name: string, id: *, attributes: {name: *, class: string|string|string|string|string|string|string}[]}}
     */
    static describe(
        options: Object = {}
    ): { name: string, classId: string, attributes: Array<?Object> } {
        const instance = new this();

        const omit = _.get(options, "attributes.omit", []);

        return {
            name: instance.getClassName(),
            classId: _.get(instance, "classId"),
            attributes: Object.keys(instance.getAttributes())
                .map(key => {
                    const attribute = instance.getAttribute(key);
                    if (!attribute) {
                        return null;
                    }

                    if (omit.includes(key)) {
                        return null;
                    }

                    return {
                        name: attribute.getName(),
                        protected: attribute.getSkipOnPopulate(),
                        class: attribute.constructor.name
                    };
                })
                .filter(value => value)
        };
    }

    /**
     * Creates a clone of given params first.
     * If soft delete functionality is enabled, this will append "deleted = false" filter, meaning only non-deleted
     * entities can be taken into consideration. If "deleted" flag was already set from the outside, it won't take any action.
     * @param params
     * @private
     */
    static __prepareParams(params: Object) {
        const clone = _.cloneDeep(params);
        if (_.get(this, "crud.delete.soft") === true) {
            _.set(clone, "query.deleted", _.get(clone, "query.deleted", false));
        }
        return clone;
    }
}

Entity.classId = "";
Entity.storageClassId = "";
Entity.driver = new Driver();
Entity.pool = new EntityPool();
Entity.crud = {
    logs: false,
    delete: {
        soft: false
    }
};

export default Entity;
