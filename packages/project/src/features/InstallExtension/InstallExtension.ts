import { createImplementation } from "@webiny/di";
import { InstallExtension, InstallExtensionService } from "~/abstractions/index.js";

export class DefaultInstallExtension implements InstallExtension.Interface {
    constructor(private installExtensionService: InstallExtensionService.Interface) {}

    execute(params: InstallExtension.Params) {
        return this.installExtensionService.execute(params);
    }
}

export const installExtension = createImplementation({
    abstraction: InstallExtension,
    implementation: DefaultInstallExtension,
    dependencies: [InstallExtensionService]
});
