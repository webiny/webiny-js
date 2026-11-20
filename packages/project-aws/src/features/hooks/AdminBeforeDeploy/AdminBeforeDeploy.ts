import { createComposite } from "@webiny/di";
import { AdminBeforeDeploy } from "@webiny/project-extensions-aws/abstractions/index.js";

export class CompositeAdminBeforeDeploy implements AdminBeforeDeploy.Interface {
    constructor(private AdminBeforeDeploy: AdminBeforeDeploy.Interface[]) {}

    async execute(params: AdminBeforeDeploy.Params) {
        for (const beforeDeploy of this.AdminBeforeDeploy) {
            await beforeDeploy.execute(params);
        }
    }
}

export const adminBeforeDeploy = createComposite({
    abstraction: AdminBeforeDeploy,
    implementation: CompositeAdminBeforeDeploy,
    dependencies: [[AdminBeforeDeploy, { multiple: true }]]
});
