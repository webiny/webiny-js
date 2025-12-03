import { createComposite } from "@webiny/di";
import { ApiBeforeBuild } from "~/abstractions/index.js";

export class CompositeApiBeforeBuild implements ApiBeforeBuild.Interface {
    constructor(private apiBeforeBuild: ApiBeforeBuild.Interface[]) {}

    async execute(params: ApiBeforeBuild.Params) {
        for (const beforeBuild of this.apiBeforeBuild) {
            await beforeBuild.execute(params);
        }
    }
}

export const apiBeforeBuild = createComposite({
    abstraction: ApiBeforeBuild,
    implementation: CompositeApiBeforeBuild,
    dependencies: [[ApiBeforeBuild, { multiple: true }]]
});
