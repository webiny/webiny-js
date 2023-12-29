import store from "store";

export class LocalStorage<TValue> {
    private key: string;

    constructor(key: string) {
        this.key = key;
    }

    public getFromStorage(): TValue {
        return store.get(this.key);
    }

    public setToStorage(value: TValue): void {
        store.set(this.key, value);
    }
}
