import Error from "@webiny/error";
import { NotAuthorizedError } from "@webiny/api-security";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import defaults from "./defaults";
import { FormBuilderContext, Settings } from "../../types";

export default {
    type: "context",
    apply(context: FormBuilderContext) {
        const { tenancy } = context;
        const keys = () => ({ PK: `T#${tenancy.getCurrentTenant().id}#SYSTEM`, SK: "FB" });

        context.formBuilder = {
            ...context.formBuilder,
            system: {
                async getVersion() {
                    const { db, i18n } = context;

                    const [[system]] = await db.read({
                        ...defaults.db,
                        query: keys()
                    });

                    // Backwards compatibility check
                    if (!system) {
                        const [[settings]] = await db.read({
                            ...defaults.db,
                            query: {
                                PK: `T#root#L#${i18n.getDefaultLocale().code}#FB#SETTINGS`,
                                SK: "default"
                            }
                        });

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
                async install({ domain }) {
                    const { db, i18n, formBuilder, elasticsearch } = context;

                    const version = await this.getVersion();
                    if (version) {
                        throw new Error(
                            "Form builder is already installed.",
                            "FORM_BUILDER_INSTALL_ABORTED"
                        );
                    }

                    // Prepare "settings" data
                    const data: Partial<Settings> = {};

                    if (domain) {
                        data.domain = domain;
                    }

                    await formBuilder.settings.createSettings(data);

                    // Create ES index if it doesn't already exist.
                    try {
                        const esIndex = defaults.es(context);
                        const { body: exists } = await elasticsearch.indices.exists(esIndex);
                        if (!exists) {
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
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    } catch (err) {
                        await db.delete({
                            ...defaults.db,
                            query: {
                                PK: `T#root#L#${i18n.getDefaultLocale().code}#FB#SETTINGS`,
                                SK: "default"
                            }
                        });

                        throw new Error(
                            "Form builder failed to install!",
                            "FORM_BUILDER_INSTALL_ABORTED",
                            { reason: err.message }
                        );
                    }

                    await formBuilder.system.setVersion(context.WEBINY_VERSION);
                },
                async upgrade(version) {
                    const identity = context.security.getIdentity();
                    if (!identity) {
                        throw new NotAuthorizedError();
                    }

                    const upgradePlugins = context.plugins
                        .byType<UpgradePlugin>("api-upgrade")
                        .filter(pl => pl.app === "form-builder");

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
            }
        };
    }
};
