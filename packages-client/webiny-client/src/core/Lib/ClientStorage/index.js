/**
 * ClientStorage class
 * Serves as an interface to given storage abstractions (adapters/drivers/bridges...call them what you like).
 * This way you can easily replace a library your project is using globally.
 */
class ClientStorage {
    constructor(storage) {
        this.storage = storage;
    }

    set(key, value) {
        this.storage.set(key, value);
        return this;
    }

    get(key) {
        return this.storage.get(key);
    }

    remove(key) {
        this.storage.remove(key);
        return this;
    }

    clear() {
        this.storage.clearAll();
        return this;
    }
}

export default ClientStorage;