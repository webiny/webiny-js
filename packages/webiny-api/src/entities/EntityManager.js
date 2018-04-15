import type Entity from "./entity";
type ExtensionCallback = ({ id: string, entity: Entity }) => void;

class EntityManager {
    extensions: { [key: string]: Array<ExtensionCallback> };

    constructor() {
        this.extensions = {};
    }

    extend(id: string, cb: ExtensionCallback) {
        const callbacks = this.extensions[id] || [];
        callbacks.push(cb);
        this.extensions[id] = callbacks;
    }

    applyExtensions(entity: Entity) {
        const id = entity.constructor.classId;
        const wildcardCallbacks = this.extensions["*"] || [];
        const callbacks = this.extensions[id] || [];
        wildcardCallbacks.map(cb => cb(entity));
        callbacks.map(cb => cb(entity));
    }
}

export default EntityManager;
