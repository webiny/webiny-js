import { createComposite } from "@webiny/di";
import { BeforeWatch } from "~/abstractions/index.js";

export class CompositeBeforeWatch implements BeforeWatch.Interface {
    constructor(private BeforeWatch: BeforeWatch.Interface[]) {}

    async execute(params: BeforeWatch.Params) {
        for (const beforeWatch of this.BeforeWatch) {
            await beforeWatch.execute(params);
        }
    }
}

export const beforeWatch = createComposite({
    abstraction: BeforeWatch,
    implementation: CompositeBeforeWatch,
    dependencies: [[BeforeWatch, { multiple: true }]]
});
