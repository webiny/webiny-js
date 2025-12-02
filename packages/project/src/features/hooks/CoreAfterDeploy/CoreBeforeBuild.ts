import { createComposite } from "@webiny/di";
import { CoreAfterDeploy } from "~/abstractions/index.js";

export class CompositeCoreAfterDeploy implements CoreAfterDeploy.Interface {
    constructor(private coreAfterDeploy: CoreAfterDeploy.Interface[]) {}

    async execute(params: CoreAfterDeploy.Params) {
        for (const beforeBuild of this.coreAfterDeploy) {
            await beforeBuild.execute(params);
        }
    }
}

export const coreAfterDeploy = createComposite({
    abstraction: CoreAfterDeploy,
    implementation: CompositeCoreAfterDeploy,
    dependencies: [[CoreAfterDeploy, { multiple: true }]]
});
