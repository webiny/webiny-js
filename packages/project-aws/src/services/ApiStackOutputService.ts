import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { ApiStackOutputService } from "../abstractions/index.js";

export class DefaultApiStackOutputService implements ApiStackOutputService.Interface {
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends ApiStackOutputService.Output = ApiStackOutputService.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>({
            app: "api"
        });
    }
}

export const apiStackOutputService = createImplementation({
    abstraction: ApiStackOutputService,
    implementation: DefaultApiStackOutputService,
    dependencies: [GetAppStackOutput]
});
