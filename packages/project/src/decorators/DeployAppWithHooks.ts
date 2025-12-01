import {
    AdminAfterDeploy,
    AdminBeforeDeploy,
    AfterDeploy,
    ApiAfterDeploy,
    ApiBeforeDeploy,
    BeforeDeploy,
    CoreAfterDeploy,
    CoreBeforeDeploy,
    DeployApp
} from "~/abstractions/index.js";

export class DeployAppWithHooks implements DeployApp.Interface {
    constructor(
        private beforeDeploy: BeforeDeploy.Interface,
        private afterDeploy: AfterDeploy.Interface,
        private adminBeforeDeploy: AdminBeforeDeploy.Interface,
        private adminAfterDeploy: AdminAfterDeploy.Interface,
        private apiBeforeDeploy: ApiBeforeDeploy.Interface,
        private apiAfterDeploy: ApiAfterDeploy.Interface,
        private coreBeforeDeploy: CoreBeforeDeploy.Interface,
        private coreAfterDeploy: CoreAfterDeploy.Interface,
        private decoratee: DeployApp.Interface
    ) {}

    async execute(params: DeployApp.Params) {
        await this.beforeDeploy.execute(params);

        switch (params.app) {
            case "core":
                await this.coreBeforeDeploy.execute(params);
                break;
            case "api":
                await this.apiBeforeDeploy.execute(params);
                break;
            case "admin":
                await this.adminBeforeDeploy.execute(params);
                break;
        }

        const result = await this.decoratee.execute(params);

        switch (params.app) {
            case "core":
                await this.coreAfterDeploy.execute(params);
                break;
            case "api":
                await this.apiAfterDeploy.execute(params);
                break;
            case "admin":
                await this.adminAfterDeploy.execute(params);
                break;
        }

        await this.afterDeploy.execute(params);

        return result;
    }
}

export const deployAppWithHooks = DeployApp.createDecorator({
    decorator: DeployAppWithHooks,
    dependencies: [
        AfterDeploy,
        BeforeDeploy,
        AdminBeforeDeploy,
        AdminAfterDeploy,
        ApiBeforeDeploy,
        ApiAfterDeploy,
        CoreBeforeDeploy,
        CoreAfterDeploy
    ]
});
