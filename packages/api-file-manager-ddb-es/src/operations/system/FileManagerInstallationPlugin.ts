import { InstallationPlugin } from "@webiny/api-file-manager/plugins/definitions/InstallationPlugin";
import configurations from "~/operations/configurations";

export class FileManagerInstallationPlugin extends InstallationPlugin {
    public name = "fm.system.ddb-es-installation";

    public async beforeInstall({ context }): Promise<void> {
        const { elasticSearch } = context;
        const esIndex = configurations.es(context);
        const { body: exists } = await elasticSearch.indices.exists(esIndex);
        if (exists) {
            return;
        }
        await elasticSearch.indices.create({
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
                        }
                    }
                }
            }
        });
    }
}
