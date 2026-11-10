import { AdminStackOutputService } from "@webiny/project-extensions-aws/abstractions/index.js";
import { createAwsOnlyError } from "./createAwsOnlyError.js";

class StandaloneAdminStackOutput implements AdminStackOutputService.Interface {
    async execute(): Promise<never> {
        throw createAwsOnlyError("AdminStackOutput");
    }
}

export const StandaloneAdminStackOutputService = AdminStackOutputService.createImplementation({
    implementation: StandaloneAdminStackOutput,
    dependencies: []
});
