import { createComposite } from "@webiny/di";
import { AdminBeforeWatch } from "~/abstractions/index.js";

export class CompositeAdminBeforeWatch implements AdminBeforeWatch.Interface {
    constructor(private adminBeforeWatch: AdminBeforeWatch.Interface[]) {}

    async execute(params: AdminBeforeWatch.Params) {
        for (const beforeWatch of this.adminBeforeWatch) {
            await beforeWatch.execute(params);
        }
    }
}

export const adminBeforeWatch = createComposite({
    abstraction: AdminBeforeWatch,
    implementation: CompositeAdminBeforeWatch,
    dependencies: [[AdminBeforeWatch, { multiple: true }]]
});
