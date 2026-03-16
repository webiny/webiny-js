import type DataLoader from "dataloader";

export interface CacheKeyParams {
    name: string;
    tenant: string;
    modelId: string;
}

export interface ClearAllParams {
    tenant: string;
}

export class DataLoaderCache {
    private readonly cache: Record<string, DataLoader<any, any>> = {};

    public getDataLoader<I = any, R = any>(params: CacheKeyParams): DataLoader<I, R> | null {
        const key = this.createKey(params);

        return this.cache[key] || null;
    }

    public setDataLoader(params: CacheKeyParams, dataLoader: DataLoader<any, any>): void {
        const key = this.createKey(params);
        this.cache[key] = dataLoader;
    }

    public clearAll(params?: ClearAllParams): void {
        if (!params) {
            for (const current in this.cache) {
                this.cache[current].clearAll();
            }
            return;
        }
        const key = `${params.tenant}_`;
        for (const current in this.cache) {
            if (current.startsWith(key) === false) {
                continue;
            }
            this.cache[current].clearAll();
        }
    }

    private createKey(params: CacheKeyParams): string {
        return `${params.tenant}_${params.modelId}_${params.name}`;
    }
}
