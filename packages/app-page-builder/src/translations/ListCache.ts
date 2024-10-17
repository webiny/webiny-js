import { makeAutoObservable, runInAction, toJS } from "mobx";

export type Constructor<T> = new (...args: any[]) => T;

export interface IListCachePredicate<T> {
    (item: T): boolean;
}

export interface IListCacheItemUpdater<T> {
    (item: T): T;
}

export interface IListCache<T> {
    count(): number;
    clear(): void;
    hasItems(): boolean;
    getItems(): T[];
    getItem(predicate: IListCachePredicate<T>): T | undefined;
    addItems(items: T[]): void;
    updateItems(updater: IListCacheItemUpdater<T>): void;
    removeItems(predicate: IListCachePredicate<T>): void;
}

export class ListCache<T> implements IListCache<T> {
    private state: T[];

    constructor() {
        this.state = [];

        makeAutoObservable(this);
    }

    count() {
        return this.state.length;
    }

    clear() {
        runInAction(() => {
            this.state = [];
        });
    }

    hasItems() {
        return this.state.length > 0;
    }

    getItems() {
        return [...this.state.map(item => toJS(item))];
    }

    getItem(predicate: IListCachePredicate<T>): T | undefined {
        const item = this.state.find(item => predicate(item));

        return item ? toJS(item) : undefined;
    }

    addItems(items: T[]) {
        runInAction(() => {
            this.state = [...this.state, ...items];
        });
    }

    updateItems(updater: IListCacheItemUpdater<T>) {
        runInAction(() => {
            this.state = [...this.state.map(item => updater(item))];
        });
    }

    removeItems(predicate: IListCachePredicate<T>) {
        runInAction(() => {
            this.state = this.state.filter(item => !predicate(item));
        });
    }
}
