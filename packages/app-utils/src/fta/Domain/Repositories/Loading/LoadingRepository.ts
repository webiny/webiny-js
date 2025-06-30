import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "./ILoadingRepository";

export class LoadingRepository implements ILoadingRepository {
    private loadings: Map<string, boolean>;

    constructor() {
        this.loadings = new Map();
        makeAutoObservable(this);
    }

    get() {
        return Object.fromEntries(this.loadings);
    }

    getActiveLoadings(): string[] {
        return [...this.loadings.entries()].filter(([, value]) => value).map(([key]) => key);
    }

    hasLoading() {
        return [...this.loadings.values()].some(Boolean);
    }

    isLoading(action: string) {
        return this.loadings.get(action) ?? false;
    }

    async set(action: string, isLoading = true) {
        this.loadings.set(action, isLoading);
    }

    async runCallBack(callback: Promise<any>, action: string) {
        await this.set(action, true);
        const result = await callback;
        await this.set(action, false);
        return result;
    }
}
