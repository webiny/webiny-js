import { CoreStackOutputService } from "@webiny/project/abstractions/aws/index.js";
import { createAwsOnlyError } from "./createAwsOnlyError.js";

class StandaloneCoreStackOutput implements CoreStackOutputService.Interface {
    async execute(): Promise<never> {
        throw createAwsOnlyError("CoreStackOutput");
    }
}

export const StandaloneCoreStackOutputService = CoreStackOutputService.createImplementation({
    implementation: StandaloneCoreStackOutput,
    dependencies: []
});
