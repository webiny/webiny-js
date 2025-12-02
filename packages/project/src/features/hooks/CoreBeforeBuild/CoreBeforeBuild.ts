import { createComposite } from "@webiny/di";
import { CoreBeforeBuild } from "~/abstractions/index.js";

export class CompositeCoreBeforeBuild implements CoreBeforeBuild.Interface {
    constructor(private coreBeforeBuild: CoreBeforeBuild.Interface[]) {}

    async execute(params: CoreBeforeBuild.Params) {
        for (const beforeBuild of this.coreBeforeBuild) {
            await beforeBuild.execute(params);
        }
    }
}

export const coreBeforeBuild = createComposite({
    abstraction: CoreBeforeBuild,
    implementation: CompositeCoreBeforeBuild,
    dependencies: [[CoreBeforeBuild, { multiple: true }]]
});
