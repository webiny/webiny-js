// @flow
import { Endpoint, ApiContainer } from "./../endpoint";

type ExtensionCallback = ({ id: string, api: ApiContainer }) => void;

class App {
    name: string;
    endpoints: Array<Class<Endpoint>>;
    endpointExtensions: { [key: string]: Array<ExtensionCallback> };

    constructor(name: string) {
        this.name = name;
        this.endpoints = [];
        this.endpointExtensions = {};
    }

    getEndpoints(): Array<Class<Endpoint>> {
        return this.endpoints;
    }

    extendEndpoint(id: string, cb: ExtensionCallback) {
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.push(cb);
        this.endpointExtensions[id] = callbacks;
    }

    applyEndpointExtensions(endpoint: Endpoint) {
        const id = endpoint.constructor.classId;
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.map(cb => cb({ id, endpoint, api: endpoint.getApi() }));
    }
}

export default App;
