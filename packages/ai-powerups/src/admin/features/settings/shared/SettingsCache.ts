import { makeAutoObservable, runInAction } from "mobx";
import type { ISettingsCache } from "./abstractions.js";

class SettingsCacheImpl implements ISettingsCache {
    private data: Record<string, any> | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get(): Record<string, any> | null {
        return this.data;
    }

    set(data: Record<string, any>): void {
        runInAction(() => {
            this.data = data;
        });
    }
}

export const settingsCache = new SettingsCacheImpl();
