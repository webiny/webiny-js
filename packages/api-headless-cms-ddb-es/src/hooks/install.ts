import { CmsInstallHooksPlugin } from "@webiny/api-headless-cms/types";
import WebinyError from "@webiny/error";

export default (): CmsInstallHooksPlugin => ({
    type: "cms-install-hooks",
    afterInstall: async context => {
        try {
            await context.elasticSearch.indices.putTemplate({
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
});
