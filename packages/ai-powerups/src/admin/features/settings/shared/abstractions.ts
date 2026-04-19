import { createAbstraction } from "@webiny/feature/admin";

export interface ISettingsCache {
    get(): Record<string, any> | null;
    set(data: Record<string, any>): void;
}

export const SettingsCache = createAbstraction<ISettingsCache>("AiPowerUps/SettingsCache");
export namespace SettingsCache {
    export type Interface = ISettingsCache;
}
