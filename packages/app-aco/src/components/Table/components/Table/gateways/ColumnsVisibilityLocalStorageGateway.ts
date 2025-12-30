import { LocalStorage } from "./LocalStorage.js";
import type { IColumnsVisibilityGateway } from "./IColumnsVisibilityGateway.js";

export class ColumnsVisibilityLocalStorageGateway implements IColumnsVisibilityGateway {
    private localStorage: LocalStorage<Record<string, boolean>>;

    constructor(namespace: string) {
        this.localStorage = new LocalStorage<Record<string, boolean>>(
            `WBY_column_visibility_${namespace}`
        );
    }

    get() {
        return Promise.resolve(this.localStorage.getFromStorage());
    }

    async set(value: Record<string, boolean>) {
        return this.localStorage.setToStorage(value);
    }
}
