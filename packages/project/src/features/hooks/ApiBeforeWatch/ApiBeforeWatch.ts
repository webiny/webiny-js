import { createComposite } from "@webiny/di";
import { ApiBeforeWatch } from "~/abstractions/index.js";

export class CompositeApiBeforeWatch implements ApiBeforeWatch.Interface {
    constructor(private apiBeforeWatch: ApiBeforeWatch.Interface[]) {}

    async execute(params: ApiBeforeWatch.Params) {
        for (const beforeWatch of this.apiBeforeWatch) {
            await beforeWatch.execute(params);
        }
    }
}

export const apiBeforeWatch = createComposite({
    abstraction: ApiBeforeWatch,
    implementation: CompositeApiBeforeWatch,
    dependencies: [[ApiBeforeWatch, { multiple: true }]]
});
