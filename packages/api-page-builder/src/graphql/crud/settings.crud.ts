import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./utils/defaults";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext, Settings, SettingsHookPlugin } from "@webiny/api-page-builder/types";
import { NotAuthorizedError } from "@webiny/api-security";
import DataLoader from "dataloader";
import executeHookCallbacks from "./utils/executeHookCallbacks";
import { SettingsModel } from "@webiny/api-page-builder/utils/models";

const TYPE = "pb.settings";

const checkBasePermissions = async (context: PbContext) => {
    await context.i18nContent.checkI18NContentPermission();
    const pbPagePermission = await context.security.getPermission("pb.settings");
    if (!pbPagePermission) {
        throw new NotAuthorizedError();
    }
};

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    apply(context) {
        const { db } = context;
        const PK = () => `${getPKPrefix(context)}SETTINGS`;
        const SK = () => "default";

        const settingsDataLoader = new DataLoader<string, Settings>(async types => {
            const [[data]] = await db.read<Settings>({
                ...defaults.db,
                query: { PK: PK(), SK: { $gt: " " } },
                limit: 1
            });

            if (data) {
                return types.map(() => data);
            }

            const defaultSettings = await new SettingsModel().populate({}).toJSON();
            await db.create({
                ...defaults.db,
                data: { ...defaultSettings, PK: PK(), SK: SK(), TYPE }
            });

            return types.map(() => defaultSettings);
        });

        const hookPlugins = context.plugins.byType<SettingsHookPlugin>("pb-page-hooks");

        context.pageBuilder = {
            ...context.pageBuilder,
            settings: {
                getSettingsCacheKey() {
                    return PK();
                },
                async get() {
                    // With this line commented, we made this endpoint public.
                    // We did this because of the public website pages which need to access the settings.
                    // It's possible we'll create another GraphQL field, made for this exact purpose.
                    // auth !== false && (await checkBasePermissions(context));
                    return settingsDataLoader.load("default");
                },
                async update(next, { auth } = { auth: true }) {
                    auth !== false && (await checkBasePermissions(context));

                    const current = await this.get({ auth });
                    const prevWebsiteUrl = current.websiteUrl;
                    const settings = new SettingsModel().populate(current).populate(next);
                    await settings.validate();

                    const data = await settings.toJSON();
                    const nextWebsiteUrl = data.websiteUrl;
                    await executeHookCallbacks(hookPlugins, "beforeUpdate", context, data);

                    await db.update({
                        ...defaults.db,
                        query: { PK: PK(), SK: SK() },
                        data
                    });

                    // Update websiteUrl info - we must know to which tenant given websiteUrl is linked.
                    // Important for serving pages later.
                    if (prevWebsiteUrl !== nextWebsiteUrl) {
                        if (prevWebsiteUrl) {
                            await db.delete({
                                query: { PK: "PB#DOMAIN#TENANT", SK: prevWebsiteUrl }
                            });
                        }

                        if (nextWebsiteUrl) {
                            const { security } = context;
                            await db.create({
                                data: {
                                    PK: "PB#DOMAIN#TENANT",
                                    SK: nextWebsiteUrl,
                                    websiteUrl: nextWebsiteUrl,
                                    tenant: security.getTenant().id
                                }
                            });
                        }
                    }

                    await executeHookCallbacks(hookPlugins, "afterUpdate", context, data);

                    return settings.toJSON();
                }
            }
        };
    }
};

export default plugin;
