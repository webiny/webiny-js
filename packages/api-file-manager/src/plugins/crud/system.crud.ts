import { NotAuthorizedError } from "@webiny/api-security";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import Error from "@webiny/error";
import { FileManagerContext, Settings, SystemCRUD } from "~/types";
import defaults from "./utils/defaults";
import { UpgradePlugin } from "@webiny/api-upgrade/types";

export default (context: FileManagerContext): SystemCRUD => {
    const { tenancy } = context;

    const keys = () => ({ PK: `T#${tenancy.getCurrentTenant().id}#SYSTEM`, SK: "FM" });

    return {
        async getVersion() {
            const { db, fileManager } = context;

            const [[system]] = await db.read({
                ...defaults.db,
                query: keys()
            });

            // Backwards compatibility check
            if (!system) {
                // If settings exist, it means this system was installed before versioning was introduced.
                // 5.0.0-beta.4 is the last version before versioning was introduced.
                const settings = await fileManager.settings.getSettings();
                return settings ? "5.0.0-beta.4" : null;
            }

            return system.version;
        },
        async setVersion(version: string) {
            const { db } = context;

            const [[system]] = await db.read({
                ...defaults.db,
                query: keys()
            });

            if (system) {
                await db.update({
                    ...defaults.db,
                    query: keys(),
                    data: {
                        version
                    }
                });
            } else {
                await db.create({
                    ...defaults.db,
                    data: {
                        ...keys(),
                        version
                    }
                });
            }
        },
        async install({ srcPrefix }) {
            const { fileManager, elasticSearch } = context;
            const version = await fileManager.system.getVersion();

            if (version) {
                throw new Error("File Manager is already installed.", "FILES_INSTALL_ABORTED");
            }

            const data: Partial<Settings> = {};

            if (srcPrefix) {
                data.srcPrefix = srcPrefix;
            }

            await fileManager.settings.createSettings(data);

            // Create ES index if it doesn't already exist.
            const esIndex = defaults.es(context);
            const { body: exists } = await elasticSearch.indices.exists(esIndex);
            if (!exists) {
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

            await fileManager.system.setVersion(context.WEBINY_VERSION);

            return true;
        },
        async upgrade(version) {
            const identity = context.security.getIdentity();
            if (!identity) {
                throw new NotAuthorizedError();
            }

            const upgradePlugins = context.plugins
                .byType<UpgradePlugin>("api-upgrade")
                .filter(pl => pl.app === "file-manager");

            const plugin = getApplicablePlugin({
                deployedVersion: context.WEBINY_VERSION,
                installedAppVersion: await this.getVersion(),
                upgradePlugins,
                upgradeToVersion: version
            });

            await plugin.apply(context);

            // Store new app version
            await this.setVersion(version);

            return true;
        }
    };
};
