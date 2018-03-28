"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
class App {
    constructor(name) {
        this.name = name;
        this.endpoints = [];
        this.endpointExtensions = {};
        this.entityExtensions = {};
    }

    getEndpoints() {
        return this.endpoints;
    }

    extendEndpoint(id, cb) {
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.push(cb);
        this.endpointExtensions[id] = callbacks;
    }

    extendEntity(id, cb) {
        const callbacks = this.entityExtensions[id] || [];
        callbacks.push(cb);
        this.entityExtensions[id] = callbacks;
    }

    applyEndpointExtensions(endpoint) {
        const id = endpoint.constructor.classId;
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.map(cb => cb({ id, endpoint, api: endpoint.getApi() }));
    }

    applyEntityExtensions(entity) {
        const id = entity.constructor.classId;
        const wildcardCallbacks = this.entityExtensions["*"] || [];
        const callbacks = this.entityExtensions[id] || [];
        wildcardCallbacks.map(cb => cb(entity));
        callbacks.map(cb => cb(entity));
    }
}

exports.default = App;
//# sourceMappingURL=app.js.map
