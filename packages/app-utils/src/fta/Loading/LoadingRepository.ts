import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "./ILoadingRepository";

export class LoadingRepository implements ILoadingRepository {
    private loadings: Map<string, boolean>;

    constructor() {
        this.loadings = new Map();
        makeAutoObservable(this);
    }

    async init() {
        return Promise.resolve();
    }

    get() {
        return Object.fromEntries(this.loadings);
    }

    async set(key: string, isLoading = true) {
        this.loadings.set(key, isLoading);
    }

    async runCallBack(callback: Promise<any>, key: string) {
        await this.set(key, true);
        const result = await callback;
        await this.set(key, false);
        return result;
    }
}
