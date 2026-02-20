import { WcpFeatureOverrides as WcpFeatureOverridesAbstraction } from "./abstractions.js";
import { BuildParams } from "../../buildParams/abstractions.js";

class WcpFeatureOverridesImpl implements WcpFeatureOverridesAbstraction.Interface {
    constructor(private buildParams: BuildParams.Interface) {}

    isEnabled(featureName: string): boolean {
        const value = this.buildParams.get<boolean>(`wcp.feature.${featureName}`);
        return value !== false;
    }
}

export const WcpFeatureOverrides = WcpFeatureOverridesAbstraction.createImplementation({
    implementation: WcpFeatureOverridesImpl,
    dependencies: [BuildParams]
});
