import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { CoreStackOutputService } from "../abstractions/index.js";

export class DefaultCoreStackOutputService implements CoreStackOutputService.Interface {
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends CoreStackOutputService.Output = CoreStackOutputService.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>({
            app: "core"
        });
    }
}

export const coreStackOutputService = createImplementation({
    abstraction: CoreStackOutputService,
    implementation: DefaultCoreStackOutputService,
    dependencies: [GetAppStackOutput]
});
