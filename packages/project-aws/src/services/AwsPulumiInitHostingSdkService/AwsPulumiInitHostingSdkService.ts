import { createImplementation } from "@webiny/di";
import { InitHostingSdkService } from "@webiny/project/abstractions/index.js";
import { registerSrcExtensions } from "@webiny/project/utils/index.js";
import { CorePulumi } from "@webiny/project-extensions-aws/extensions/CorePulumi.js";
import { ApiPulumi } from "@webiny/project-extensions-aws/extensions/ApiPulumi.js";
import { AdminPulumi } from "@webiny/project-extensions-aws/extensions/AdminPulumi.js";

/**
 * Registers the Pulumi programs the project config names (`Core/Pulumi`, `Api/Pulumi`,
 * `Admin/Pulumi`). Both the CLI and the Pulumi program's own SDK need these.
 */
export class AwsPulumiInitHostingSdkService implements InitHostingSdkService.Interface {
    async execute({ container, projectExtensions, project }: InitHostingSdkService.Params) {
        const pulumiExtensions = [
            ...projectExtensions.extensionsByType(CorePulumi),
            ...projectExtensions.extensionsByType(ApiPulumi),
            ...projectExtensions.extensionsByType(AdminPulumi)
        ];

        await registerSrcExtensions(container, pulumiExtensions, project);
    }
}

export const awsPulumiInitHostingSdkService = createImplementation({
    abstraction: InitHostingSdkService,
    implementation: AwsPulumiInitHostingSdkService,
    dependencies: []
});
