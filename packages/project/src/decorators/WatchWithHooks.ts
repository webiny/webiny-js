import {
    AdminBeforeWatch,
    ApiBeforeWatch,
    BeforeWatch,
    CoreBeforeWatch,
    Watch
} from "~/abstractions/index.js";

export class WatchWithHooks implements Watch.Interface {
    constructor(
        private adminBeforeWatch: AdminBeforeWatch.Interface,
        private apiBeforeWatch: ApiBeforeWatch.Interface,
        private coreBeforeWatch: CoreBeforeWatch.Interface,
        private beforeWatch: BeforeWatch.Interface,
        private decoratee: Watch.Interface
    ) {}

    async execute(params: Watch.Params) {
        await this.beforeWatch.execute(params);

        if ("app" in params) {
            if (params.app === "core") {
                await this.coreBeforeWatch.execute(params);
                return this.decoratee.execute(params);
            }

            if (params.app === "api") {
                await this.apiBeforeWatch.execute(params);
                return this.decoratee.execute(params);
            }

            if (params.app === "admin") {
                await this.adminBeforeWatch.execute(params);
                return this.decoratee.execute(params);
            }
        }

        return this.decoratee.execute(params);
    }
}

export const watchWithHooks = Watch.createDecorator({
    decorator: WatchWithHooks,
    dependencies: [AdminBeforeWatch, ApiBeforeWatch, CoreBeforeWatch, BeforeWatch]
});
