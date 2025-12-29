import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { AdminStackOutputService as AdminStackOutputServiceAbstraction } from "../abstractions/index.js";

export class DefaultAdminStackOutputServiceAbstraction
    implements AdminStackOutputServiceAbstraction.Interface
{
    constructor(private readonly getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute<
        TOutput extends
            AdminStackOutputServiceAbstraction.Output = AdminStackOutputServiceAbstraction.Output
    >(): Promise<TOutput | null> {
        return this.getAppStackOutput.execute<TOutput>("admin");
    }
}

export const AdminStackOutputService = AdminStackOutputServiceAbstraction.createImplementation({
    implementation: DefaultAdminStackOutputServiceAbstraction,
    dependencies: [GetAppStackOutput]
});
