import { IColumnsVisibilityGateway } from "./IColumnsVisibilityGateway";
import type { ILocalStorage } from "@webiny/app/localStorage/feature/abstractions.js";

export class ColumnsVisibilityLocalStorageGateway implements IColumnsVisibilityGateway {
    private localStorage: ILocalStorage;
    private readonly key: string;

    constructor(localStorage: ILocalStorage, namespace: string) {
        this.localStorage = localStorage;
        this.key = `column_visibility_${namespace}`;
    }

    async get() {
        return Promise.resolve(this.localStorage.get<Record<string, boolean>>(this.key));
    }

    async set(value: Record<string, boolean>) {
        return this.localStorage.set(this.key, value);
    }
}
