import { makeAutoObservable } from "mobx";
import type { IFrontendSettings } from "~/shared/types.js";

export const CACHE_KEY = "FrontendSettings/Settings";

class ObservableSettingsCache {
    private data = new Map<string, IFrontendSettings>();

    constructor() {
        makeAutoObservable(this);
    }

    get(key: string): IFrontendSettings | undefined {
        return this.data.get(key);
    }

    set(key: string, value: IFrontendSettings): void {
        this.data.set(key, value);
    }

    has(key: string): boolean {
        return this.data.has(key);
    }

    delete(key: string): boolean {
        return this.data.delete(key);
    }
}

export const settingsCache = new ObservableSettingsCache();
