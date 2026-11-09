import { createComposite } from "@webiny/di";
import { CorePulumi } from "@webiny/project-aws-extensions/abstractions/features/pulumi/index.js";

export class CompositeCorePulumi implements CorePulumi.Interface {
    constructor(private corePulumi: CorePulumi.Interface[]) {}

    async execute(params: CorePulumi.Params) {
        for (const handler of this.corePulumi) {
            await handler.execute(params);
        }
    }
}

export const corePulumi = createComposite({
    abstraction: CorePulumi,
    implementation: CompositeCorePulumi,
    dependencies: [[CorePulumi, { multiple: true }]]
});
