import { createDecorator } from "@webiny/di";
import { BuildApp } from "~/abstractions/index.js";
import {
    AdminAfterBuild,
    AdminBeforeBuild,
    AfterBuild,
    ApiAfterBuild,
    ApiBeforeBuild,
    BeforeBuild,
    CoreAfterBuild,
    CoreBeforeBuild
} from "~/abstractions/index.js";

export class BuildAppWithHooks implements BuildApp.Interface {
    constructor(
        private beforeBuild: BeforeBuild.Interface,
        private afterBuild: AfterBuild.Interface,
        private adminBeforeBuild: AdminBeforeBuild.Interface,
        private adminAfterBuild: AdminAfterBuild.Interface,
        private apiBeforeBuild: ApiBeforeBuild.Interface,
        private apiAfterBuild: ApiAfterBuild.Interface,
        private coreBeforeBuild: CoreBeforeBuild.Interface,
        private coreAfterBuild: CoreAfterBuild.Interface,
        private decoratee: BuildApp.Interface
    ) {}

    async execute(params: BuildApp.Params) {
        await this.beforeBuild.execute(params);

        switch (params.app) {
            case "core":
                await this.coreBeforeBuild.execute(params);
                break;
            case "api":
                await this.apiBeforeBuild.execute(params);
                break;
            case "admin":
                await this.adminBeforeBuild.execute(params);
                break;
        }

        const packagesBuilder = await this.decoratee.execute(params);

        packagesBuilder.onAfterBuild(async () => {
            switch (params.app) {
                case "core":
                    await this.coreAfterBuild.execute(params);
                    break;
                case "api":
                    await this.apiAfterBuild.execute(params);
                    break;
                case "admin":
                    await this.adminAfterBuild.execute(params);
                    break;
            }

            await this.afterBuild.execute(params);
        });

        return packagesBuilder;
    }
}

export const buildAppWithHooks = createDecorator({
    abstraction: BuildApp,
    decorator: BuildAppWithHooks,
    dependencies: [
        BeforeBuild,
        AfterBuild,
        AdminBeforeBuild,
        AdminAfterBuild,
        ApiBeforeBuild,
        ApiAfterBuild,
        CoreBeforeBuild,
        CoreAfterBuild
    ]
});
