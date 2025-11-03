import { createComposite } from "@webiny/di";
import { ApiAfterDeploy } from "~/abstractions/index.js";

export class CompositeApiAfterDeploy implements ApiAfterDeploy.Interface {
    constructor(private apiAfterDeploy: ApiAfterDeploy.Interface[]) {}

    async execute(params: ApiAfterDeploy.Params) {
        for (const beforeBuild of this.apiAfterDeploy) {
            await beforeBuild.execute(params);
        }
    }
}

export const apiAfterDeploy = createComposite({
    abstraction: ApiAfterDeploy,
    implementation: CompositeApiAfterDeploy,
    dependencies: [[ApiAfterDeploy, { multiple: true }]]
});
