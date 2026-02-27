import { createAbstraction } from "@webiny/feature/api";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";

export interface IFeatureFlagsAbstraction {
    get(): FeatureFlagsClass;
}

export const FeatureFlags = createAbstraction<IFeatureFlagsAbstraction>("FeatureFlags");

export namespace FeatureFlags {
    export type Interface = IFeatureFlagsAbstraction;
}
