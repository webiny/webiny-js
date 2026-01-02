import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { CoreStackOutputService as CoreStackOutputServiceAbstraction } from "../abstractions/index.js";

export class DefaultCoreStackOutputServiceAbstraction
    implements CoreStackOutputServiceAbstraction.Interface
{
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends
            CoreStackOutputServiceAbstraction.Output = CoreStackOutputServiceAbstraction.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>("core");
    }
}

export const CoreStackOutputService = CoreStackOutputServiceAbstraction.createImplementation({
    implementation: DefaultCoreStackOutputServiceAbstraction,
    dependencies: [GetAppStackOutput]
});
