import cloneDeep from "lodash/cloneDeep.js";

export type Constructor<T> = new (...args: any[]) => T;

export interface IListCachePredicate<T> {
    (item: T): boolean;
}

export interface IListCacheItemUpdater<T> {
    (item: T): T;
}

export interface IListCache<T> {
    clear(): void;
    hasItems(): boolean;
    getItems(): T[];
    addItems(items: T[]): void;
    updateItems(updater: IListCacheItemUpdater<T>): void;
}

export class ListCache<T> implements IListCache<T> {
    private state: T[];

    constructor() {
        this.state = [];
    }

    clear(): void {
        this.state = [];
    }

    hasItems(): boolean {
        return this.state.length > 0;
    }

    getItems(): T[] {
        return cloneDeep(this.state);
    }

    addItems(items: T[]): void {
        this.state.push(...items);
    }

    updateItems(updater: IListCacheItemUpdater<T>): void {
        this.state = this.state.map(item => updater(item));
    }

    removeItems(predicate: IListCachePredicate<T>) {
        this.state = this.state.filter(item => !predicate(item));
    }
}
