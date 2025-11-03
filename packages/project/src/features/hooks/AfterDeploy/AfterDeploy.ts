import { createComposite } from "@webiny/di";
import { AfterDeploy } from "~/abstractions/index.js";

export class CompositeAfterDeploy implements AfterDeploy.Interface {
    constructor(private AfterDeploy: AfterDeploy.Interface[]) {}

    async execute(params: AfterDeploy.Params) {
        for (const afterDeploy of this.AfterDeploy) {
            await afterDeploy.execute(params);
        }
    }
}

export const afterDeploy = createComposite({
    abstraction: AfterDeploy,
    implementation: CompositeAfterDeploy,
    dependencies: [[AfterDeploy, { multiple: true }]]
});
