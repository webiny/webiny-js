import { createComposite } from "@webiny/di";
import { CoreBeforeDeploy } from "~/abstractions/index.js";

export class CompositeCoreBeforeDeploy implements CoreBeforeDeploy.Interface {
    constructor(private coreBeforeDeploy: CoreBeforeDeploy.Interface[]) {}

    async execute(params: CoreBeforeDeploy.Params) {
        for (const beforeDeploy of this.coreBeforeDeploy) {
            await beforeDeploy.execute(params);
        }
    }
}

export const coreBeforeDeploy = createComposite({
    abstraction: CoreBeforeDeploy,
    implementation: CompositeCoreBeforeDeploy,
    dependencies: [[CoreBeforeDeploy, { multiple: true }]]
});
