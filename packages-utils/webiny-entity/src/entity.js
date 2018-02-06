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
    static classId: ?string;
    static driver: Driver;
    static pool: EntityPool;
    static crud: {
        logs?: boolean,
        delete?: {
            soft?: boolean
        }
    };
    static listeners: {};

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
                const attr: ?Attribute = instance.getModel().getAttribute(key);
                if (attr) {
                    attr.setValue(value);
                    return true;
                }

                instance[key] = value;
                return true;
            },
            get: (instance, key) => {
                if (["classId", "driver"].includes(key)) {
                    return instance.constructor[key];
                }

                const attr: ?Attribute = instance.getModel().getAttribute(key);
                if (attr) {
                    return attr.getValue();
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
            this.attr("savedOn").date();
            this.attr("createdOn").date();
            this.attr("updatedOn").date();
        }

        if (_.get(this, "constructor.crud.delete.soft")) {
            this.attr("deleted")
                .boolean()
                .setDefaultValue(false);

            this.on("beforeDelete", () => (proxy.deleted = true));
        }

        this.on("delete", () => {
            if (this.getAttribute("id").isEmpty()) {
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
    attr(name: string): EntityAttributesContainer {
        return this.getModel()
            .getAttributesContainer()
            .attr(name);
    }

    /**
     * Returns single attribute by given name.
     */
    getAttribute(name: string): Attribute {
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
    async toJSON(path: string): Promise<JSON> {
        return _.merge(
            { id: this.getAttribute("id").getValue() },
            await this.getModel().toJSON(path)
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
    async save(params: EntitySaveParams & Object = {}) {
        if (this.processing) {
            return;
        }

        this.processing = "save";
        const existing = this.isExisting();
        const logs = _.get(this, "constructor.crud.logs");

        try {
            const events = params.events || {};
            events.save !== false && (await this.emit("save"));

            params.validation !== false && (await this.validate());

            events.beforeSave !== false && (await this.emit("beforeSave"));

            if (existing) {
                if (logs) {
                    this.savedOn = new Date();
                    this.updatedOn = new Date();
                }
                events.beforeUpdate !== false && (await this.emit("beforeUpdate"));
            } else {
                if (logs) {
                    this.savedOn = new Date();
                    this.createdOn = new Date();
                }
                events.beforeCreate !== false && (await this.emit("beforeCreate"));
            }

            await this.getDriver().save(this, params);
            this.setExisting();

            events.afterSave !== false && (await this.emit("afterSave"));
            if (existing) {
                events.afterUpdate !== false && (await this.emit("afterUpdate"));
            } else {
                events.afterCreate !== false && (await this.emit("afterCreate"));
            }

            this.getModel().clean();

            this.getEntityPool().add(this);
        } catch (e) {
            throw e;
        } finally {
            this.processing = null;
        }
    }

    /**
     * Deletes current and all linked entities (if autoDelete on the attribute was enabled).
     * @param params
     */
    async delete(params: EntityDeleteParams & Object = {}) {
        if (this.processing) {
            return;
        }

        const soft = _.get(this, "constructor.crud.delete.soft");

        try {
            const events = params.events || {};
            events.delete !== false && (await this.emit("delete"));

            params.validation !== false && (await this.validate());

            events.beforeDelete !== false && (await this.emit("beforeDelete"));

            if (soft) {
                await this.getDriver().save(this, params);
            } else {
                await this.getDriver().delete(this, params);
            }
            events.afterDelete !== false && (await this.emit("afterDelete"));

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
    static async findById(id: mixed, params: Object = {}): Promise<null | Entity> {
        if (!id) {
            return null;
        }

        const pooled = this.getEntityPool().get(this, id);
        if (pooled) {
            return pooled;
        }

        const newParams = _.merge(_.cloneDeep(params), { query: { id } });
        return await this.findOne(newParams);
    }

    /**
     * Finds one or more entities matched by given IDs.
     * @param ids
     * @param params
     */
    static async findByIds(ids: Array<mixed>, params: Object = {}): Promise<EntityCollection> {
        return await this.find(_.merge(_.cloneDeep(params), { query: { id: ids } }));
    }

    /**
     * Finds one entity matched by given query parameters.
     * @param params
     */
    static async findOne(params: EntityFindParams & Object = {}): Promise<null | Entity> {
        const prepared = this.__prepareParams(params);
        await this.emit("query", prepared);

        const queryResult = await this.getDriver().findOne(this, prepared);
        const result = queryResult.getResult();
        if (_.isObject(result)) {
            const pooled = this.getEntityPool().get(this, result.id);
            if (pooled) {
                return pooled;
            }

            const entity = new this().setExisting().populateFromStorage(((result: any): Object));
            this.getEntityPool().add(entity);
            return entity;
        }
        return null;
    }

    /**
     * Finds one or more entities matched by given query parameters.
     * @param params
     */
    static async find(params: EntityFindParams & Object = {}): Promise<EntityCollection> {
        const prepared = this.__prepareParams(params);
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
                } else {
                    const entity = new this().setExisting().populateFromStorage(result[i]);
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
    static async count(params: EntityFindParams & Object = {}): Promise<number> {
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

Entity.classId = null;
Entity.driver = new Driver();
Entity.pool = new EntityPool();
Entity.crud = {
    logs: false,
    delete: {
        soft: false
    }
};

export default Entity;
