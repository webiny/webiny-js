import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { AdminStackOutputService } from "../abstractions/index.js";

export class DefaultAdminStackOutputService implements AdminStackOutputService.Interface {
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends AdminStackOutputService.Output = AdminStackOutputService.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>({
            app: "admin"
        });
    }
}

export const adminStackOutputService = createImplementation({
    abstraction: AdminStackOutputService,
    implementation: DefaultAdminStackOutputService,
    dependencies: [GetAppStackOutput]
});
