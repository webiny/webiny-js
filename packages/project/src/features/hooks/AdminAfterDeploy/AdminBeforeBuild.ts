import { createComposite } from "@webiny/di";
import { AdminAfterDeploy } from "~/abstractions/index.js";

export class CompositeAdminAfterDeploy implements AdminAfterDeploy.Interface {
    constructor(private AdminAfterDeploy: AdminAfterDeploy.Interface[]) {}

    async execute(params: AdminAfterDeploy.Params) {
        for (const beforeBuild of this.AdminAfterDeploy) {
            await beforeBuild.execute(params);
        }
    }
}

export const adminAfterDeploy = createComposite({
    abstraction: AdminAfterDeploy,
    implementation: CompositeAdminAfterDeploy,
    dependencies: [[AdminAfterDeploy, { multiple: true }]]
});
