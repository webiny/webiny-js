class App {
    constructor(name) {
        this.name = name;
        this.endpoints = [];
        this.endpointExtensions = {};
    }

    extendEndpoint(id, cb) {
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.push(cb);
        this.endpointExtensions[id] = callbacks;
    }

    applyEndpointExtensions(endpoint) {
        const id = endpoint.constructor.classId;
        const callbacks = this.endpointExtensions[id] || [];
        callbacks.map(cb => cb({ id, endpoint, api: endpoint.getApi() }));
    }
}

export default App;