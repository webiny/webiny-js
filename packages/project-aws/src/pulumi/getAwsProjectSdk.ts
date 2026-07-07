import { ProjectSdk, type AppName, type IStackOutput } from "@webiny/project";
import { registerAwsPulumiServices } from "~/registerAwsProjectFeatures.js";

/**
 * ProjectSdk for the Pulumi program. The Pulumi program runs in its own process and does NOT go
 * through the CLI's GetProjectSdkService, so it must register the AWS pulumi services itself
 * (name prefix, stack output, …). We register only `registerAwsPulumiServices` — not the full
 * `registerAwsProjectFeatures` — to avoid pulling in the CLI-only deploy/workspace decorators and
 * hooks (which would, e.g., re-run workspace builders mid-deploy).
 *
 * Empty params → env/variant/region are picked up from the parent process via env
 * (getProjectSdkContextFromEnv).
 */
export const getAwsProjectSdk = () => ProjectSdk.init({}, registerAwsPulumiServices);

/**
 * AWS-aware equivalent of `@webiny/project`'s `getStackOutput` helper: reads an app's stack output
 * via the aws-aware SDK (base `getStackOutput` uses `getProjectSdk()`, which lacks the pulumi
 * services now that they live in project-aws → "No registration found for GetAppStackOutput").
 */
export const getStackOutput = async <TOutput extends IStackOutput = IStackOutput>(
    appName: AppName
): Promise<TOutput | null> => {
    const sdk = await getAwsProjectSdk();
    return sdk.getAppStackOutput<TOutput>(appName);
};
