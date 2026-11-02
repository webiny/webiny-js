import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";
import { AwsTags as awsTagsExt } from "@webiny/project/extensions/aws/AwsTags.js";

export const getAwsTagsFromExtension = (projectConfig: IProjectConfigModel) => {
    const awsTags: Record<string, string> = {};
    projectConfig.extensionsByType(awsTagsExt).forEach(ext => {
        Object.assign(awsTags, ext.params.tags);
    });

    return awsTags;
};
