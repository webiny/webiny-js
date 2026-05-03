import { createComposite } from "@webiny/di";
import { AdminPulumi } from "~/abstractions/features/pulumi/index.js";

export class CompositeAdminPulumi implements AdminPulumi.Interface {
    constructor(private adminPulumi: AdminPulumi.Interface[]) {}

    async execute(params: AdminPulumi.Params) {
        for (const handler of this.adminPulumi) {
            await handler.execute(params);
        }
    }
}

export const adminPulumi = createComposite({
    abstraction: AdminPulumi,
    implementation: CompositeAdminPulumi,
    dependencies: [[AdminPulumi, { multiple: true }]]
});
