import { type AppName } from "@webiny/project";
import { type GetAppStackOutput } from "~/abstractions/features/GetAppStackOutput.js";
import { getAwsProjectSdk } from "./getAwsProjectSdk.js";

/**
 * Reads an app's stack output through a project SDK that has the AWS Pulumi services registered.
 */
export const getStackOutput = async <
    TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput
>(
    appName: AppName
): Promise<TOutput | null> => {
    const sdk = await getAwsProjectSdk();
    return sdk.getAppStackOutput<TOutput>(appName);
};
