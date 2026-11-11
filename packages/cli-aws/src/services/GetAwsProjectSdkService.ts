import { createImplementation } from "@webiny/di";
import { GetProjectSdkService } from "@webiny/cli-core/abstractions/index.js";
import { AwsProjectSdk } from "@webiny/project-aws/AwsProjectSdk.js";
import { GetAwsProjectSdkService } from "~/abstractions/GetAwsProjectSdkService.js";

export class DefaultGetAwsProjectSdkService implements GetAwsProjectSdkService.Interface {
    constructor(private readonly getProjectSdkService: GetProjectSdkService.Interface) {}

    async execute() {
        const projectSdk = await this.getProjectSdkService.execute();
        return AwsProjectSdk.from(projectSdk);
    }
}

export const getAwsProjectSdkService = createImplementation({
    abstraction: GetAwsProjectSdkService,
    implementation: DefaultGetAwsProjectSdkService,
    dependencies: [GetProjectSdkService]
});
