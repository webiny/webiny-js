import { createImplementation } from "@webiny/di";
import { GetProjectSdkService } from "@webiny/cli-core/abstractions/index.js";
import { GetAwsProjectSdkService } from "~/abstractions/GetAwsProjectSdkService.js";

/*
 * cli-core's commands ask for `GetProjectSdkService`. In the AWS CLI they get the same SDK the AWS
 * commands get from `GetAwsProjectSdkService`, so the AWS features are registered for both.
 */
export class AwsGetProjectSdkService implements GetProjectSdkService.Interface {
    constructor(private readonly getAwsProjectSdkService: GetAwsProjectSdkService.Interface) {}

    execute() {
        return this.getAwsProjectSdkService.execute();
    }
}

export const awsGetProjectSdkService = createImplementation({
    abstraction: GetProjectSdkService,
    implementation: AwsGetProjectSdkService,
    dependencies: [GetAwsProjectSdkService]
});
