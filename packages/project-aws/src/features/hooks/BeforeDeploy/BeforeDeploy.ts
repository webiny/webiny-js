import { createComposite } from "@webiny/di";
import { BeforeDeploy } from "@webiny/project-extensions-aws/abstractions/index.js";

export class CompositeBeforeDeploy implements BeforeDeploy.Interface {
    constructor(private BeforeDeploy: BeforeDeploy.Interface[]) {}

    async execute(params: BeforeDeploy.Params) {
        for (const beforeDeploy of this.BeforeDeploy) {
            await beforeDeploy.execute(params);
        }
    }
}

export const beforeDeploy = createComposite({
    abstraction: BeforeDeploy,
    implementation: CompositeBeforeDeploy,
    dependencies: [[BeforeDeploy, { multiple: true }]]
});
