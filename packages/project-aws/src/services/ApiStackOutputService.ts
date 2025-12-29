import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { ApiStackOutputService as ApiStackOutputServiceExt } from "../abstractions/index.js";

export class DefaultApiStackOutputServiceExt implements ApiStackOutputServiceExt.Interface {
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends ApiStackOutputServiceExt.Output = ApiStackOutputServiceExt.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>("api");
    }
}

export const ApiStackOutputService = createImplementation({
    abstraction: ApiStackOutputServiceExt,
    implementation: DefaultApiStackOutputServiceExt,
    dependencies: [GetAppStackOutput]
});
