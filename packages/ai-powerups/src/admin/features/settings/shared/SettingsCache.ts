import { makeAutoObservable, runInAction } from "mobx";
import type { IAiPowerUpsSettingsCache } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "./abstractions.js";

class SettingsCacheImpl implements IAiPowerUpsSettingsCache {
    private data: IAiPowerUpsSettings | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get(): IAiPowerUpsSettings | null {
        return this.data;
    }

    set(data: IAiPowerUpsSettings): void {
        runInAction(() => {
            this.data = data;
        });
    }
}

export const settingsCache = new SettingsCacheImpl();
