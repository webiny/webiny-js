import { ElasticSearch as elasticSearchExt } from "~/pulumi/extensions/ElasticSearch.js";
import { type IProjectConfigModel } from "@webiny/project/abstractions/models/index.js";

export const getEsConfigFromExtension = (projectConfig: IProjectConfigModel) => {
    const [elasticSearchExtension] = projectConfig.extensionsByType(elasticSearchExt);
    if (!elasticSearchExtension) {
        return false;
    }

    const { enabled, domainName, indexPrefix, sharedIndexes } = elasticSearchExtension.params;
    if (enabled === false) {
        return false;
    }

    if (domainName || indexPrefix || sharedIndexes) {
        const elasticSearch: Omit<typeof elasticSearchExtension.params, "enabled"> = {};
        if (domainName) {
            elasticSearch.domainName = domainName;
        }

        if (indexPrefix) {
            elasticSearch.indexPrefix = indexPrefix;
        }

        if (sharedIndexes) {
            elasticSearch.sharedIndexes = sharedIndexes;
        }

        return elasticSearch;
    }

    return true;
};
