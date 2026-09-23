import { createImplementation } from "@webiny/di";
import { ValidateProjectConfigService } from "~/abstractions/index.js";
import { ProjectError } from "~/ProjectError.js";
import { traceAsync } from "~/utils/trace/index.js";

export class DefaultValidateProjectConfigService implements ValidateProjectConfigService.Interface {
    async execute(projectConfig: ValidateProjectConfigService.Params): Promise<void> {
        const extensionTypes = Object.keys(projectConfig.config);
        for (const extensionType of extensionTypes) {
            const extensionsCollection = projectConfig.extensionsByType(extensionType);

            // Validation is serial, and an extension is free to hit the network or the filesystem in
            // its `validate`, so each type is timed separately.
            await traceAsync(`validate "${extensionType}"`, async () => {
                for (const extension of extensionsCollection) {
                    await extension.validateParams();

                    if (extension.validate) {
                        try {
                            await extension.validate();
                        } catch (error) {
                            throw ProjectError.from(
                                `Validation failed for extension of type %s: ${error.message}`,
                                extensionType
                            );
                        }
                    }
                }
            });
        }
    }
}

export const validateProjectConfigService = createImplementation({
    abstraction: ValidateProjectConfigService,
    implementation: DefaultValidateProjectConfigService,
    dependencies: []
});
