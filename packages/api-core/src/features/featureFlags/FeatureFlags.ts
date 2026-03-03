import { FeatureFlags as FeatureFlagsAbstraction } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import type { IFeatureFlagsDto } from "@webiny/feature-flags";

class FeatureFlagsImpl implements FeatureFlagsAbstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    get(): FeatureFlagsClass {
        const raw = this.buildParams.get<IFeatureFlagsDto>("FeatureFlags") ?? {};
        return FeatureFlagsClass.fromDto(raw);
    }
}

export const FeatureFlags = FeatureFlagsAbstraction.createImplementation({
    implementation: FeatureFlagsImpl,
    dependencies: [BuildParams]
});
