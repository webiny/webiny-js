import * as aws from "@pulumi/aws";
import { type PulumiApp } from "@webiny/pulumi";
import { tagResources } from "~/pulumi/utils/index.js";
import { getEnvVariableWebinyProjectName } from "~/pulumi/env/projectName.js";
import { getEnvVariableWebinyEnv } from "~/pulumi/env/env.js";
import { getEnvVariableWebinyVariant } from "~/pulumi/env/variant.js";
import { type AppName, getProjectSdk } from "@webiny/project";
import { AwsTags as awsTagsExt } from "~/pulumi/extensions/AwsTags.js";

export function getAwsAccountId(app: PulumiApp) {
    return app.addHandler(() => {
        return aws.getCallerIdentity({}).then(x => x.accountId);
    });
}

export function getAwsRegion(app: PulumiApp) {
    return app.addHandler(() => {
        return aws.config.requireRegion();
    });
}

export async function applyAwsResourceTags(appName: AppName) {
    const sdk = await getProjectSdk();
    const projectConfig = await sdk.getProjectConfig();

    const awsTagsFromExtensions: Record<string, string> = {};
    projectConfig.extensionsByType(awsTagsExt).forEach(ext => {
        Object.assign(awsTagsFromExtensions, ext.params.tags);
    });

    tagResources({
        ...awsTagsFromExtensions,
        WbyApp: appName,
        WbyProjectName: getEnvVariableWebinyProjectName(),
        WbyEnvironment: getEnvVariableWebinyEnv(),
        WbyEnvironmentVariant: getEnvVariableWebinyVariant()
    });
}
