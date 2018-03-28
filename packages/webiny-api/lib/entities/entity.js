"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _webinyApi = require("webiny-api");

var _webinyEntity = require("webiny-entity");

class Entity extends _webinyEntity.Entity {
    constructor() {
        super();

        _webinyApi.app.apps.map(app => {
            app.applyEntityExtensions(this);
        });
    }
}

Entity.crud = {
    logs: true,
    delete: {
        soft: true
    }
};

exports.default = Entity;
//# sourceMappingURL=entity.js.map
