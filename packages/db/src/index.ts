import type { IStore } from "~/store/types.js";
import { Store } from "~/store/Store.js";

export * from "./types.js";

export interface DbDriver<T> extends IStore {
    getClient(): T;
}

export interface ConstructorArgs<T> {
    driver: DbDriver<T>;
    table?: string;
}

class Db<T> {
    public driver: DbDriver<T>;
    public readonly table?: string;
    public readonly store: IStore;

    constructor({ driver, table }: ConstructorArgs<T>) {
        this.table = table;
        this.driver = driver;
        this.store = new Store<T>({
            driver
        });
    }
}

export { Db };
