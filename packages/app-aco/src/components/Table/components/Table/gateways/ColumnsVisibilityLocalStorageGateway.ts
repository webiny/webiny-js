import type { IColumnsVisibilityGateway } from "./IColumnsVisibilityGateway.js";
import { LocalStorage } from "@webiny/app/exports/admin/localStorage.js";

export class ColumnsVisibilityLocalStorageGateway implements IColumnsVisibilityGateway {
    private readonly key: string;

    constructor(
        private localStorage: LocalStorage.Interface,
        namespace: string
    ) {
        this.key = `${namespace}/column-visibility`;
    }

    get() {
        return Promise.resolve(this.localStorage.get(this.key) ?? {});
    }

    async set(value: Record<string, boolean>) {
        return this.localStorage.set(this.key, value);
    }
}
