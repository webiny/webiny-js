import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "~/abstractions";

export class LoadingRepository implements ILoadingRepository {
    private loadings: Map<string, boolean>;

    constructor() {
        this.loadings = new Map();
        makeAutoObservable(this);
    }

    async init(loadingEnum: Record<string, any>) {
        for (const key in loadingEnum) {
            if (typeof loadingEnum[key] === "boolean") {
                this.loadings.set(key, loadingEnum[key]);
            }
        }
    }

    get() {
        return Object.fromEntries(this.loadings);
    }

    async set(key: string, isLoading = true) {
        this.loadings.set(key, isLoading);
    }
}
