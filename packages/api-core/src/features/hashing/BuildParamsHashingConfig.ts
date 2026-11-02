import { HashingConfig } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";

class BuildParamsHashingConfigImpl implements HashingConfig.Interface {
    readonly pepper: string;
    readonly costN: number | null;

    constructor(buildParams: BuildParams.Interface) {
        this.pepper = buildParams.get<string>("HashingPepper") ?? "";
        const costN = buildParams.get<number | string>("HashingCost");
        this.costN = costN ? Number(costN) : null;
    }
}

export const BuildParamsHashingConfig = HashingConfig.createImplementation({
    implementation: BuildParamsHashingConfigImpl,
    dependencies: [BuildParams]
});
