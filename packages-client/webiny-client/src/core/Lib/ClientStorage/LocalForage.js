import localforage from 'localforage';

class LocalForage {
    constructor() {
        this.instance = localforage;
    }

    set(key, value) {
        localforage.setItem(key, value);
        return this;
    }

    get(key) {
        return localforage.getItem(key);
    }

    remove(key) {
        localforage.removeItem(key);
        return this;
    }

    clear() {
        localforage.clear();
        return this;
    }
}

export default LocalForage;