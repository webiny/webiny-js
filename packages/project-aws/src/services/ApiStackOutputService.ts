import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { ApiStackOutputService as ApiStackOutputServiceAbstraction } from "../abstractions/index.js";

export class DefaultApiStackOutputServiceAbstraction
    implements ApiStackOutputServiceAbstraction.Interface
{
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends ApiStackOutputServiceAbstraction.Output =
            ApiStackOutputServiceAbstraction.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>("api");
    }
}

export const ApiStackOutputService = ApiStackOutputServiceAbstraction.createImplementation({
    implementation: DefaultApiStackOutputServiceAbstraction,
    dependencies: [GetAppStackOutput]
});
