import { createComposite } from "@webiny/di";
import { BeforeBuild } from "~/abstractions/index.js";

export class CompositeBeforeBuild implements BeforeBuild.Interface {
    constructor(private BeforeBuild: BeforeBuild.Interface[]) {}

    async execute(params: BeforeBuild.Params) {
        for (const beforeBuild of this.BeforeBuild) {
            await beforeBuild.execute(params);
        }
    }
}

export const beforeBuild = createComposite({
    abstraction: BeforeBuild,
    implementation: CompositeBeforeBuild,
    dependencies: [[BeforeBuild, { multiple: true }]]
});
