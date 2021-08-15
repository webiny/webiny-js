import { InstallationPlugin } from "@webiny/api-headless-cms/plugins/InstallationPlugin";
import WebinyError from "@webiny/error";

/**
 * We're creating a new plugin class and giving it a fixed name.
 * This will ensure that there's only 1 instance of this plugin registered at any given time.
 */
export class CmsSystemInstallationPlugin extends InstallationPlugin {
    public name = "cms.system.ddb-es-installation";

    async beforeInstall({ context }) {
        const { elasticsearch } = context;
        try {
            await elasticsearch.indices.putTemplate({
                name: "headless-cms-entries-index",
                body: {
                    index_patterns: ["*headless-cms*"],
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
        } catch (err) {
            console.log(err);
            throw new WebinyError(
                "Index template creation failed!",
                "CMS_INSTALLATION_INDEX_TEMPLATE_ERROR"
            );
        }
    }
}
