import { OpenSearch as openSearchExt } from "~/pulumi/extensions/OpenSearch.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export const getOsConfigFromExtension = (projectConfig: IProjectConfigModel) => {
    const [openSearchExtension] = projectConfig.extensionsByType(openSearchExt);
    if (!openSearchExtension) {
        // OpenSearch not used.
        return undefined;
    }

    const { enabled, domainName, indexPrefix, sharedIndexes } = openSearchExtension.params;
    if (enabled === false) {
        return false;
    }

    if (domainName || indexPrefix || sharedIndexes) {
        const openSearch: Omit<typeof openSearchExtension.params, "enabled"> = {};
        if (domainName) {
            openSearch.domainName = domainName;
        }

        if (indexPrefix) {
            openSearch.indexPrefix = indexPrefix;
        }

        if (sharedIndexes) {
            openSearch.sharedIndexes = sharedIndexes;
        }

        return openSearch;
    }

    return true;
};
