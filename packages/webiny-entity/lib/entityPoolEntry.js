"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ = require(".");

class EntityPoolEntry {
    constructor(entity) {
        this.entity = entity;
        this.meta = {
            createdOn: new Date()
        };
    }

    getEntity() {
        return this.entity;
    }

    setEntity(entity) {
        this.entity = entity;
        return this;
    }

    getMeta() {
        return this.meta;
    }

    setMeta(meta) {
        this.meta = meta;
        return this;
    }
}
exports.default = EntityPoolEntry;
//# sourceMappingURL=entityPoolEntry.js.map
