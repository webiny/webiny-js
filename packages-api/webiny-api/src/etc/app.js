// @flow
import type { Endpoint, ApiContainer } from "./../endpoint";
import type { Entity } from "./../entity";

type EndpointExtensionCallback = ({ id: string, api: ApiContainer }) => void;
type EntityExtensionCallback = ({ id: string, entity: Entity }) => void;

class App {
    name: string;
    endpoints: Array<Class<Endpoint>>;
    endpointExtensions: { [key: string]: Array<EndpointExtensionCallback> };
    entityExtensions: { [key: string]: Array<EntityExtensionCallback> };

    constructor(name: string) {
        this.name = name;
        this.endpoints = [];
        this.endpointExtensions = {};
        this.entityExtensions = {};
    }

    getEndpoints(): Array<Class<Endpoint>> {
        return this.endpoints;
    }

    extendEndpoint(id: string, cb: EndpointExtensionCallback) {
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.push(cb);
        this.endpointExtensions[id] = callbacks;
    }

    extendEntity(id: string, cb: EntityExtensionCallback) {
        const callbacks = this.entityExtensions[id] || [];
        callbacks.push(cb);
        this.entityExtensions[id] = callbacks;
    }

    applyEndpointExtensions(endpoint: Endpoint) {
        const id = endpoint.constructor.classId;
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.map(cb => cb({ id, endpoint, api: endpoint.getApi() }));
    }

    applyEntityExtensions(entity: Entity) {
        const id = entity.constructor.classId;
        const wildcardCallbacks = this.entityExtensions["*"] || [];
        const callbacks = this.entityExtensions[id] || [];
        wildcardCallbacks.map(cb => cb({ id, entity }));
        callbacks.map(cb => cb({ id, entity }));
    }
}

export default App;
