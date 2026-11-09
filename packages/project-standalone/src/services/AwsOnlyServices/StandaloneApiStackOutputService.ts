import { ApiStackOutputService } from "@webiny/project-aws-extensions/abstractions/index.js";
import { createAwsOnlyError } from "./createAwsOnlyError.js";

class StandaloneApiStackOutput implements ApiStackOutputService.Interface {
    async execute(): Promise<never> {
        throw createAwsOnlyError("ApiStackOutput");
    }
}

export const StandaloneApiStackOutputService = ApiStackOutputService.createImplementation({
    implementation: StandaloneApiStackOutput,
    dependencies: []
});
