import { makeAutoObservable, runInAction } from "mobx";
import { LoadingRepository as Abstraction, type ILoadingRepository } from "./abstractions.js";

class LoadingRepositoryImpl implements ILoadingRepository {
    private loadingStates: Record<string, boolean> = {};

    constructor() {
        makeAutoObservable(this, {}, { autoBind: true });
    }

    get(): Record<string, boolean> {
        return { ...this.loadingStates };
    }

    async set(action: string, isLoading: boolean = true): Promise<void> {
        runInAction(() => {
            if (isLoading) {
                this.loadingStates[action] = true;
            } else {
                delete this.loadingStates[action];
            }
        });
    }

    async runCallback<T>(callback: Promise<T>, action: string): Promise<T> {
        await this.set(action, true);
        try {
            const result = await callback;
            await this.set(action, false);
            return result;
        } catch (error) {
            await this.set(action, false);
            throw error;
        }
    }

    isLoading(action: string): boolean {
        return this.loadingStates[action] === true;
    }

    hasLoading(): boolean {
        return Object.keys(this.loadingStates).length > 0;
    }

    isEmpty(): boolean {
        return Object.keys(this.loadingStates).length === 0;
    }
}

export const LoadingRepository = Abstraction.createImplementation({
    implementation: LoadingRepositoryImpl,
    dependencies: []
});
