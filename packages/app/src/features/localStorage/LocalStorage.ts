import { makeAutoObservable } from "mobx";
import { LocalStorage as LocalStorageAbstraction, LocalStorageRepository } from "./abstractions.js";
import { createImplementation } from "@webiny/di";

class LocalStorageImpl implements LocalStorageAbstraction.Interface {
    constructor(private readonly repo: LocalStorageRepository.Interface) {
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

export const LocalStorage = createImplementation({
    abstraction: LocalStorageAbstraction,
    implementation: LocalStorageImpl,
    dependencies: [LocalStorageRepository]
});
