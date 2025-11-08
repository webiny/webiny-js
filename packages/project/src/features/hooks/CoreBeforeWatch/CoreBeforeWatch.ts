import { createComposite } from "@webiny/di";
import { CoreBeforeWatch } from "~/abstractions/index.js";

export class CompositeCoreBeforeWatch implements CoreBeforeWatch.Interface {
    constructor(private coreBeforeWatch: CoreBeforeWatch.Interface[]) {}

    async execute(params: CoreBeforeWatch.Params) {
        for (const beforeWatch of this.coreBeforeWatch) {
            await beforeWatch.execute(params);
        }
    }
}

export const coreBeforeWatch = createComposite({
    abstraction: CoreBeforeWatch,
    implementation: CompositeCoreBeforeWatch,
    dependencies: [[CoreBeforeWatch, { multiple: true }]]
});
