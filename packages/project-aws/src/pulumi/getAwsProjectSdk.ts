import { AwsProjectSdk } from "~/AwsProjectSdk.js";

// The project SDK of the Pulumi program; see `AwsProjectSdk.createForPulumiProgram`.
export const getAwsProjectSdk = () => {
    return AwsProjectSdk.createForPulumiProgram();
};
