import { DbRegistry } from "~/DbRegistry";

export * from "./types";

export interface DbDriver<T> {
    getClient(): T;
}

export interface ConstructorArgs<T> {
    driver: DbDriver<T>;
    table?: string;
}

class Db<T> {
    public driver: DbDriver<T>;
    public readonly table?: string;

    public readonly registry = new DbRegistry();

    constructor({ driver, table }: ConstructorArgs<T>) {
        this.table = table;
        this.driver = driver;
    }
}

export { Db };
