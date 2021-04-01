import { NotAuthorizedError } from "@webiny/api-security";
import Error from "@webiny/error";
import { getApplicablePlugin } from "@webiny/api-upgrade";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { CmsContext, CmsInstallHooksPlugin } from "../../types";
import configurations from "../../configurations";

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
                    if (!security.getTenant()) {
                        return null;
                    }

                    const [[system]] = await db.read({
                        ...configurations.db(),
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
                        ...configurations.db(),
                        query: keys()
                    });

                    if (system) {
                        await db.update({
                            ...configurations.db(),
                            query: keys(),
                            data: {
                                version
                            }
                        });
                    } else {
                        await db.create({
                            ...configurations.db(),
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

                    const installHooks = context.plugins.byType<CmsInstallHooksPlugin>(
                        "cms-install-hooks"
                    );

                    for (const hook of installHooks) {
                        if (!hook.beforeInstall) {
                            continue;
                        }
                        await hook.beforeInstall(context);
                    }
                    // Add default content model group.
                    try {
                        await context.cms.groups.create(initialContentModelGroup);
                    } catch (ex) {
                        throw new Error(ex.message, "CMS_INSTALLATION_CONTENT_MODEL_GROUP_ERROR");
                    }

                    for (const hook of installHooks) {
                        if (!hook.afterInstall) {
                            continue;
                        }
                        await hook.afterInstall(context);
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
