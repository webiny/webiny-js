import { createAbstraction } from "@webiny/feature/api";
import type { IFeatureFlags } from "@webiny/feature-flags";

export interface IFeatureFlagsAbstraction {
    get(): IFeatureFlags;
}

export const FeatureFlags = createAbstraction<IFeatureFlagsAbstraction>("FeatureFlags");

export namespace FeatureFlags {
    export type Interface = IFeatureFlagsAbstraction;
}
