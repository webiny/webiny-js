import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import * as utils from "../../utils";
import { CmsContext } from "../../types";

const initialContentModelGroup = {
    name: "Ungrouped",
    slug: "ungrouped",
    description: "A generic content model group",
    icon: "fas/star"
};

export default {
    type: "context",
    apply(context: CmsContext) {
        const { security, db } = context;
        const keys = () => ({ PK: `T#${security.getTenant().id}#SYSTEM`, SK: "CMS" });

        context.cms = {
            ...context.cms,
            system: {
                async getVersion() {
                    const [[system]] = await db.read({
                        ...utils.defaults.db(),
                        query: keys()
                    });

                    // Backwards compatibility check
                    if (!system) {
                        // If settings already exist, it means this system was installed before versioning was introduced.
                        // 5.0.0-beta.4 is the last version before versioning was introduced.
                        const settings = await context.cms.settings.noAuth().get();

                        return settings ? "5.0.0-beta.4" : null;
                    }

                    return system.version;
                },
                async setVersion(version: string) {
                    const [[system]] = await db.read({
                        ...utils.defaults.db(),
                        query: keys()
                    });

                    if (system) {
                        await db.update({
                            ...utils.defaults.db(),
                            query: keys(),
                            data: {
                                version
                            }
                        });
                    } else {
                        await db.create({
                            ...utils.defaults.db(),
                            data: {
                                ...keys(),
                                version
                            }
                        });
                    }
                },
                install: async (): Promise<void> => {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        throw new NotAuthorizedError();
                    }

                    const version = await context.cms.system.getVersion();
                    if (version) {
                        return;
                    }

                    // Add default content model group.
                    try {
                        await context.cms.groups.create(initialContentModelGroup);
                    } catch (ex) {
                        throw new Error(ex.message, "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR");
                    }

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
                        throw new Error(
                            "Index template creation failed!",
                            "CMS_INSTALLATION_INDEX_TEMPLATE_ERROR"
                        );
                    }

                    // Set app version
                    await context.cms.system.setVersion(context.WEBINY_VERSION);
                },
                async upgrade(version) {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        throw new NotAuthorizedError();
                    }

                    const upgradePlugins = context.plugins
                        .byType<UpgradePlugin>("api-upgrade")
                        .filter(pl => pl.app === "headless-cms");

                    const plugin = getApplicablePlugin({
                        deployedVersion: context.WEBINY_VERSION,
                        installedAppVersion: await this.getVersion(),
                        upgradePlugins,
                        upgradeToVersion: version
                    });

                    await plugin.apply(context);

                    // Store new app version
                    await context.cms.system.setVersion(version);

                    return true;
                }
            }
        };
    }
};
