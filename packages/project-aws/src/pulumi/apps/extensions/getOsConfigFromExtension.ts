import { OpenSearch as openSearchExt } from "~/pulumi/extensions/OpenSearch.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export const getOsConfigFromExtension = (projectConfig: IProjectConfigModel) => {
    const [openSearchExtension] = projectConfig.extensionsByType(openSearchExt);
    if (!openSearchExtension) {
        // OpenSearch not used.
        return undefined;
    }

    const { enabled, endpoint, domainName, indexPrefix, sharedIndexes, username, password } =
        openSearchExtension.params;
    if (enabled === false) {
        return false;
    }

    if (endpoint || domainName || indexPrefix || sharedIndexes || username || password) {
        const openSearch: Omit<typeof openSearchExtension.params, "enabled"> = {};
        if (endpoint) {
            openSearch.endpoint = endpoint;
        }

        if (domainName) {
            openSearch.domainName = domainName;
        }

        if (indexPrefix) {
            openSearch.indexPrefix = indexPrefix;
        }

        if (sharedIndexes) {
            openSearch.sharedIndexes = sharedIndexes;
        }

        if (username) {
            openSearch.username = username;
        }

        if (password) {
            openSearch.password = password;
        }

        return openSearch;
    }

    return true;
};
