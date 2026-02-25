import { FeatureFlags as FeatureFlagsAbstraction } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";
import type { IFeatureFlags } from "@webiny/feature-flags";

class FeatureFlagsImpl implements FeatureFlagsAbstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    get(): IFeatureFlags {
        return this.buildParams.get<IFeatureFlags>("FeatureFlags") ?? {};
    }
}

export const FeatureFlags = FeatureFlagsAbstraction.createImplementation({
    implementation: FeatureFlagsImpl,
    dependencies: [BuildParams]
});
