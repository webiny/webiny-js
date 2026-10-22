import { HashingConfig } from "@webiny/api-core/features/hashing/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { StandaloneConfig } from "~/config/abstractions.js";
import { isHashingPepperDeclared } from "~/config/declaredSecrets.js";

/**
 * Standalone: the pepper comes from env (`WEBINY_HASHING_PEPPER`), the cost from the build. The
 * pepper is used only when the build declares one, so a stray env var can't change how hashes are
 * computed for a project that never used a pepper.
 */
class StandaloneHashingConfigImpl implements HashingConfig.Interface {
    readonly pepper: string;
    readonly costN: number | null;

    constructor(config: StandaloneConfig.Interface, buildParams: BuildParams.Interface) {
        const declared = isHashingPepperDeclared(buildParams);
        this.pepper = declared ? (config.hashing.pepper ?? "") : "";
        const costN = buildParams.get<number | string>("HashingCost");
        this.costN = costN ? Number(costN) : null;
    }
}

export const StandaloneHashingConfig = HashingConfig.createImplementation({
    implementation: StandaloneHashingConfigImpl,
    dependencies: [StandaloneConfig, BuildParams]
});
