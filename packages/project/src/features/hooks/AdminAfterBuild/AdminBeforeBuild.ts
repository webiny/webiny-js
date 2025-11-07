import { createComposite } from "@webiny/di";
import { AdminAfterBuild } from "~/abstractions/index.js";

export class CompositeAdminAfterBuild implements AdminAfterBuild.Interface {
    constructor(private AdminAfterBuild: AdminAfterBuild.Interface[]) {}

    async execute(params: AdminAfterBuild.Params) {
        for (const afterBuild of this.AdminAfterBuild) {
            await afterBuild.execute(params);
        }
    }
}

export const adminAfterBuild = createComposite({
    abstraction: AdminAfterBuild,
    implementation: CompositeAdminAfterBuild,
    dependencies: [[AdminAfterBuild, { multiple: true }]]
});
