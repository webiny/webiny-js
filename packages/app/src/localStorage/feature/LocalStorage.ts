import { makeAutoObservable } from "mobx";
import type { ILocalStorage } from "~/localStorage/feature/abstractions.js";
import type { ILocalStorageRepository } from "~/localStorage/feature/abstractions.js";

export class LocalStorage implements ILocalStorage {
    constructor(private readonly repo: ILocalStorageRepository) {
        makeAutoObservable(this);
    }

    get<T = string>(key: string) {
        return this.repo.get<T>(key);
    }

    set<T = string>(key: string, value: T) {
        this.repo.set(key, value);
    }

    remove(key: string) {
        this.repo.remove(key);
    }

    clear() {
        this.repo.clear();
    }

    keys() {
        return this.repo.keys();
    }
}
