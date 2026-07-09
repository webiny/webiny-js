import { type AppName, type IStackOutput } from "@webiny/project";
import { getAwsProjectSdk } from "./getAwsProjectSdk.js";

/**
 * AWS-aware equivalent of `@webiny/project`'s `getStackOutput` helper: reads an app's stack output
 * via the aws-aware SDK. The base `getStackOutput` uses `getProjectSdk()`, which lacks the pulumi
 * services now that they live in project-aws → "No registration found for GetAppStackOutput".
 */
export const getStackOutput = async <TOutput extends IStackOutput = IStackOutput>(
    appName: AppName
): Promise<TOutput | null> => {
    const sdk = await getAwsProjectSdk();
    return sdk.getAppStackOutput<TOutput>(appName);
};
