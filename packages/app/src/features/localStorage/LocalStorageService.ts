import { makeAutoObservable } from "mobx";
import {
    LocalStorageService as LocalStorageServiceAbstraction,
    LocalStorageRepository
} from "./abstractions.js";
import { createImplementation } from "@webiny/di-container";

class LocalStorageServiceImpl implements LocalStorageServiceAbstraction.Interface {
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

export const LocalStorageService = createImplementation({
    abstraction: LocalStorageServiceAbstraction,
    implementation: LocalStorageServiceImpl,
    dependencies: [LocalStorageRepository]
});
