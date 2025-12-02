import { createComposite } from "@webiny/di";
import { CoreAfterBuild } from "~/abstractions/index.js";

export class CompositeCoreAfterBuild implements CoreAfterBuild.Interface {
    constructor(private coreAfterBuild: CoreAfterBuild.Interface[]) {}

    async execute(params: CoreAfterBuild.Params) {
        for (const afterBuild of this.coreAfterBuild) {
            await afterBuild.execute(params);
        }
    }
}

export const coreAfterBuild = createComposite({
    abstraction: CoreAfterBuild,
    implementation: CompositeCoreAfterBuild,
    dependencies: [[CoreAfterBuild, { multiple: true }]]
});
