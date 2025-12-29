import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { CoreStackOutputService as CoreStackOutputServiceExt } from "../abstractions/index.js";

export class DefaultCoreStackOutputServiceExt implements CoreStackOutputServiceExt.Interface {
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends CoreStackOutputServiceExt.Output = CoreStackOutputServiceExt.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>({
            app: "core"
        });
    }
}

export const CoreStackOutputService = createImplementation({
    abstraction: CoreStackOutputServiceExt,
    implementation: DefaultCoreStackOutputServiceExt,
    dependencies: [GetAppStackOutput]
});
