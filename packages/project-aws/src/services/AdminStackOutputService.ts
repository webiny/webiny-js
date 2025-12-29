import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { AdminStackOutputService as AdminStackOutputServiceExt } from "../abstractions/index.js";

export class DefaultAdminStackOutputServiceExt implements AdminStackOutputServiceExt.Interface {
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends AdminStackOutputServiceExt.Output = AdminStackOutputServiceExt.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>({
            app: "admin"
        });
    }
}

export const AdminStackOutputService = createImplementation({
    abstraction: AdminStackOutputServiceExt,
    implementation: DefaultAdminStackOutputServiceExt,
    dependencies: [GetAppStackOutput]
});
