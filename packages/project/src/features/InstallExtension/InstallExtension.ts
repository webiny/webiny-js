import { createImplementation } from "@webiny/di";
import { InstallExtension, InstallExtensionService } from "~/abstractions/index.js";

export class DefaultInstallExtension implements InstallExtension.Interface {
    constructor(private installExtensionService: InstallExtensionService.Interface) {}

    execute(source: string) {
        return this.installExtensionService.execute(source);
    }
}

export const installExtension = createImplementation({
    abstraction: InstallExtension,
    implementation: DefaultInstallExtension,
    dependencies: [InstallExtensionService]
});
