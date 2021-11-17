import { InstallationPlugin } from "@webiny/api-file-manager/plugins/definitions/InstallationPlugin";
import { configurations } from "~/operations/configurations";

export class FileManagerInstallationPlugin extends InstallationPlugin {
    public name = "fm.system.ddb-es-installation";

    public async beforeInstall({ context }): Promise<void> {
        const { elasticsearch, tenancy } = context;
        const esIndex = configurations.es({
            tenant: tenancy.getCurrentTenant().id
        });
        const { body: exists } = await elasticsearch.indices.exists(esIndex);
        if (exists) {
            return;
        }
        await elasticsearch.indices.create({
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
        });
    }
}
