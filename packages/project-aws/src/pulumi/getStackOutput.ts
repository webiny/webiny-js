import { type AppName } from "@webiny/project";
import { type IStackOutput } from "~/abstractions/features/GetAppStackOutput.js";
import { getAwsProjectSdk } from "./getAwsProjectSdk.js";
import { AwsProjectSdk } from "~/AwsProjectSdk.js";

/**
 * Reads an app's stack output through a project SDK that has the AWS Pulumi services registered.
 */
export const getStackOutput = async <TOutput extends IStackOutput = IStackOutput>(
    appName: AppName
): Promise<TOutput | null> => {
    const sdk = await getAwsProjectSdk();
    return new AwsProjectSdk(sdk).getAppStackOutput<TOutput>(appName);
};
