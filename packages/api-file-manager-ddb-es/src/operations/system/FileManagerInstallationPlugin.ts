import WebinyError from "@webiny/error";
import { InstallationPlugin } from "@webiny/api-file-manager/plugins/definitions/InstallationPlugin";
import { configurations } from "~/operations/configurations";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { ElasticsearchContext } from "@webiny/api-elasticsearch/types";

// TODO @ts-refactor remove when extracting context from this package
interface FileManagerInstallationPluginBeforeInstallParams {
    context: FileManagerContext & ElasticsearchContext;
}
export class FileManagerInstallationPlugin extends InstallationPlugin {
    public override name = "fm.system.ddb-es-installation";

    public override async beforeInstall({
        context
    }: FileManagerInstallationPluginBeforeInstallParams): Promise<void> {
        const { elasticsearch, tenancy } = context;
        const esIndex = configurations.es({
            tenant: tenancy.getCurrentTenant().id
        });
        try {
            const { body: exists } = await elasticsearch.indices.exists(esIndex);
            if (exists) {
                return;
            }
        } catch (ex) {
            throw new WebinyError(
                "Could not check for existing Elasticsearch index.",
                "ELASTICSEARCH_INDEX_ERROR",
                {
                    error: ex,
                    index: esIndex.index
                }
            );
        }
        const request = {
            ...esIndex,
            body: {
                // need this part for sorting to work on text fields
                settings: {
                    analysis: {
                        analyzer: {
                            lowercase_analyzer: {
                                type: "custom",
                                filter: ["lowercase", "trim"],
                                tokenizer: "keyword"
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        property: {
                            type: "text",
                            fields: {
                                keyword: {
                                    type: "keyword",
                                    ignore_above: 256
                                }
                            },
                            analyzer: "lowercase_analyzer"
                        },
                        rawValues: {
                            type: "object",
                            enabled: false
                        }
                    }
                }
            }
        };
        try {
            await elasticsearch.indices.create(request);
        } catch (ex) {
            throw new WebinyError(
                "Could not create FileManager Elasticsearch index.",
                "ELASTICSEARCH_INDEX_CREATE_ERROR",
                {
                    error: ex,
                    index: esIndex.index,
                    request
                }
            );
        }
    }
}
