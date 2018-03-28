"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ = require(".");

class EntityPool {
    constructor() {
        this.pool = {};
    }

    add(entity) {
        if (!this.pool[entity.constructor.name]) {
            this.pool[entity.constructor.name] = {};
        }

        this.pool[entity.constructor.name][entity.id] = new _.EntityPoolEntry(entity);
        return this;
    }

    has(entity, id) {
        const entityClass = entity.getClassName();
        if (!this.pool[entityClass]) {
            return false;
        }

        const entityId = entity instanceof _.Entity ? entity.id : id;
        return typeof this.pool[entityClass][entityId] !== "undefined";
    }

    remove(entity) {
        if (!this.pool[entity.constructor.name]) {
            return this;
        }

        delete this.pool[entity.constructor.name][entity.id];
        return this;
    }

    get(entity, id) {
        const entityClass = entity.getClassName();
        if (!this.pool[entityClass]) {
            return undefined;
        }

        const entityId = entity instanceof _.Entity ? entity.id : id;
        const poolEntry = this.pool[entityClass][entityId];
        if (poolEntry) {
            return poolEntry.getEntity();
        }
        return undefined;
    }

    flush() {
        this.pool = {};
        return this;
    }
}

exports.default = EntityPool;
//# sourceMappingURL=entityPool.js.map
