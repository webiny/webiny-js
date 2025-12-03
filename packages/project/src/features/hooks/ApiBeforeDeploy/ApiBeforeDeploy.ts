import { createComposite } from "@webiny/di";
import { ApiBeforeDeploy } from "~/abstractions/index.js";

export class CompositeApiBeforeDeploy implements ApiBeforeDeploy.Interface {
    constructor(private apiBeforeDeploy: ApiBeforeDeploy.Interface[]) {}

    async execute(params: ApiBeforeDeploy.Params) {
        for (const beforeDeploy of this.apiBeforeDeploy) {
            await beforeDeploy.execute(params);
        }
    }
}

export const apiBeforeDeploy = createComposite({
    abstraction: ApiBeforeDeploy,
    implementation: CompositeApiBeforeDeploy,
    dependencies: [[ApiBeforeDeploy, { multiple: true }]]
});
