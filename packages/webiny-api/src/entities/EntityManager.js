// @flow
import type Entity from "./Entity";
type ExtensionCallback = ({ id: string, entity: Entity }) => void;

class EntityManager {
    entityClasses: Array<Class<Entity>>;
    extensions: { [key: string]: Array<ExtensionCallback> };

    constructor() {
        this.extensions = {};
        this.entityClasses = [];
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
        wildcardCallbacks.map(cb => cb({ id, entity }));
        callbacks.map(cb => cb({ id, entity }));
    }

    registerEntity(entityClass: Class<Entity>): EntityManager {
        this.entityClasses.push(entityClass);
        return this;
    }

    getEntityClasses(): Array<Class<Entity>> {
        return this.entityClasses;
    }

    getEntityClass(classId: string): Class<Entity> | null {
        for (let i = 0; i < this.getEntityClasses().length; i++) {
            let entityClass = this.getEntityClasses()[i];
            if (entityClass.classId === classId) {
                return entityClass;
            }
        }
        return null;
    }

    describe(entityClass: Class<Entity>) {
        return entityClass.describe();
    }
}

export default EntityManager;
