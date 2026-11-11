import { HashingConfig } from "@webiny/api-core/features/hashing/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { StandaloneConfig } from "~/config/abstractions.js";

/**
 * Standalone: every hash is peppered. The pepper comes from env (`WEBINY_HASHING_PEPPER`), the cost
 * from the build.
 */
class StandaloneHashingConfigImpl implements HashingConfig.Interface {
    readonly pepper: string;
    readonly costN: number | null;

    constructor(config: StandaloneConfig.Interface, buildParams: BuildParams.Interface) {
        this.pepper = config.hashing.pepper;
        const costN = buildParams.get<number | string>("HashingCost");
        this.costN = costN ? Number(costN) : null;
    }
}

export const StandaloneHashingConfig = HashingConfig.createImplementation({
    implementation: StandaloneHashingConfigImpl,
    dependencies: [StandaloneConfig, BuildParams]
});
