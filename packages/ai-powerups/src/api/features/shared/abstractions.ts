import { createAbstraction } from "@webiny/feature/api";
import type { ZodType } from "zod";

export interface IAiPowerUpsSettingsGroupHandler {
    readonly name: string;
    readonly inputSchema: ZodType<unknown>;
    /**
     * `all` is the entire persisted settings blob. A group only needs it to read a section it does
     * not own, which in practice means migrating away from one: `connections` and `modelRoles` both
     * derive their defaults from the legacy `providers` section the first time they load.
     */
    mapFromStorage(persisted: unknown, all?: Record<string, unknown>): unknown;
    mapToStorage(internal: unknown, existing: unknown | null): Promise<unknown>;
}

export const AiPowerUpsSettingsGroupHandler = createAbstraction<IAiPowerUpsSettingsGroupHandler>(
    "AiPowerUpsSettingsGroupHandler"
);

export namespace AiPowerUpsSettingsGroupHandler {
    export type Interface = IAiPowerUpsSettingsGroupHandler;
}

export interface IAiPowerUpsSettingsGroupGraphQLMapper {
    readonly name: string;
    toApi(internal: unknown): unknown | Promise<unknown>;
    fromApi(api: unknown, existing: unknown | null): unknown | Promise<unknown>;
}

export const AiPowerUpsSettingsGroupGraphQLMapper =
    createAbstraction<IAiPowerUpsSettingsGroupGraphQLMapper>(
        "AiPowerUpsSettingsGroupGraphQLMapper"
    );

export namespace AiPowerUpsSettingsGroupGraphQLMapper {
    export type Interface = IAiPowerUpsSettingsGroupGraphQLMapper;
}

import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface SettingsCacheEntry {
    raw: Record<string, unknown>;
    mapped: IAiPowerUpsSettings;
}

export interface IAiPowerUpsSettingsCache {
    get(): SettingsCacheEntry | null;
    set(raw: Record<string, unknown>, mapped: IAiPowerUpsSettings): void;
}

export const AiPowerUpsSettingsCache =
    createAbstraction<IAiPowerUpsSettingsCache>("AiPowerUpsSettingsCache");

export namespace AiPowerUpsSettingsCache {
    export type Interface = IAiPowerUpsSettingsCache;
}
