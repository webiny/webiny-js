import { createImplementation } from "@webiny/di";
import { GetApp, GetAppService } from "~/abstractions/index.js";

export class DefaultGetApp implements GetApp.Interface {
    constructor(private getAppService: GetAppService.Interface) {}

    execute(appName: GetApp.AppName) {
        return this.getAppService.execute(appName);
    }
}

export const getApp = createImplementation({
    abstraction: GetApp,
    implementation: DefaultGetApp,
    dependencies: [GetAppService]
});
