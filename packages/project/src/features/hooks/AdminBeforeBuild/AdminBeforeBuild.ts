import { createComposite } from "@webiny/di";
import { AdminBeforeBuild } from "~/abstractions/index.js";

export class CompositeAdminBeforeBuild implements AdminBeforeBuild.Interface {
    constructor(private AdminBeforeBuild: AdminBeforeBuild.Interface[]) {}

    async execute(params: AdminBeforeBuild.Params) {
        for (const beforeBuild of this.AdminBeforeBuild) {
            await beforeBuild.execute(params);
        }
    }
}

export const adminBeforeBuild = createComposite({
    abstraction: AdminBeforeBuild,
    implementation: CompositeAdminBeforeBuild,
    dependencies: [[AdminBeforeBuild, { multiple: true }]]
});
