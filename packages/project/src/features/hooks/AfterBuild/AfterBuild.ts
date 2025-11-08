import { createComposite } from "@webiny/di";
import { AfterBuild } from "~/abstractions/index.js";

export class CompositeAfterBuild implements AfterBuild.Interface {
    constructor(private AfterBuild: AfterBuild.Interface[]) {}

    async execute(params: AfterBuild.Params) {
        for (const afterBuild of this.AfterBuild) {
            await afterBuild.execute(params);
        }
    }
}

export const afterBuild = createComposite({
    abstraction: AfterBuild,
    implementation: CompositeAfterBuild,
    dependencies: [[AfterBuild, { multiple: true }]]
});
