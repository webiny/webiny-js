import { LocalStorage } from "./LocalStorage";
import { IColumnsVisibilityGateway } from "./IColumnsVisibilityGateway";

export class ColumnsVisibilityLocalStorageGateway implements IColumnsVisibilityGateway {
    private localStorage: LocalStorage<Record<string, boolean>>;

    constructor(namespace: string) {
        this.localStorage = new LocalStorage<Record<string, boolean>>(
            `webiny_column_visibility_${namespace}`
        );
    }

    get() {
        return Promise.resolve(this.localStorage.getFromStorage());
    }

    async set(value: Record<string, boolean>) {
        return this.localStorage.setToStorage(value);
    }
}
