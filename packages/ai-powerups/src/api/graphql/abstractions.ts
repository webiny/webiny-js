import { createAbstraction } from "@webiny/feature/api";
import type { IAiPowerUpsSettings } from "~/api/types.js";

export interface IAiPowerUpsSettingsGraphQLMapper {
    toApi(settings: IAiPowerUpsSettings): Promise<Record<string, unknown>>;
    fromApi(
        input: Record<string, unknown>,
        current: IAiPowerUpsSettings
    ): Promise<IAiPowerUpsSettings>;
}

export const AiPowerUpsSettingsGraphQLMapper = createAbstraction<IAiPowerUpsSettingsGraphQLMapper>(
    "AiPowerUpsSettingsGraphQLMapper"
);

export namespace AiPowerUpsSettingsGraphQLMapper {
    export type Interface = IAiPowerUpsSettingsGraphQLMapper;
}
