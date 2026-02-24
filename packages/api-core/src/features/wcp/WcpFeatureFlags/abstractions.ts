import { createAbstraction } from "@webiny/feature/api";

export interface IFeatureFlagsAbstraction {
    isEnabled(featureName: string): boolean;
}

export const FeatureFlags = createAbstraction<IFeatureFlagsAbstraction>("FeatureFlags");

export namespace FeatureFlags {
    export type Interface = IFeatureFlagsAbstraction;
}
