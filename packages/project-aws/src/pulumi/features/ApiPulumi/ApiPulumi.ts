import { createComposite } from "@webiny/di";
import { ApiPulumi } from "~/abstractions/features/pulumi/index.js";

export class CompositeApiPulumi implements ApiPulumi.Interface {
    constructor(private apiPulumi: ApiPulumi.Interface[]) {}

    async execute(params: ApiPulumi.Params) {
        for (const handler of this.apiPulumi) {
            await handler.execute(params);
        }
    }
}

export const apiPulumi = createComposite({
    abstraction: ApiPulumi,
    implementation: CompositeApiPulumi,
    dependencies: [[ApiPulumi, { multiple: true }]]
});
