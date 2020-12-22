import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./utils/defaults";
import getPKPrefix from "./utils/getPKPrefix";
import {
    PbContext,
    DefaultSettings,
    SettingsHookPlugin,
    InstallSettings
} from "@webiny/api-page-builder/types";
import { NotAuthorizedError } from "@webiny/api-security";
import DataLoader from "dataloader";
import executeHookCallbacks from "./utils/executeHookCallbacks";
import DefaultSettingsModel from "@webiny/api-page-builder/utils/models/DefaultSettings.model";
import InstallSettingsModel from "@webiny/api-page-builder/utils/models/InstallSettings.model";

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
        const { db, security, i18nContent } = context;

        const hookPlugins = context.plugins.byType<SettingsHookPlugin>("pb-page-hooks");

        context.pageBuilder = {
            ...context.pageBuilder,
            settings: {
                dataLoaders: {
                    get: new DataLoader<
                        { PK: string; SK: string },
                        DefaultSettings | InstallSettings,
                        string
                    >(
                        async keys => {
                            const results = [];
                            for (let i = 0; i < keys.length; i++) {
                                const { PK, SK } = keys[i];
                                const [[data]] = await db.read<DefaultSettings | InstallSettings>({
                                    ...defaults.db,
                                    query: { PK, SK },
                                    limit: 1
                                });
                                results.push(data);
                            }

                            return results;
                        },
                        {
                            cacheKeyFn: key => key.PK + key.SK
                        }
                    )
                },
                // Default settings - contain website, social media, and prerendering settings.
                default: {
                    PK: options => {
                        const prefix = getPKPrefix(context, options);
                        return `${prefix}SETTINGS`;
                    },
                    SK: "default",
                    getSettingsCacheKey(options) {
                        return this.PK(options);
                    },
                    async get(options) {
                        // With this line commented, we made this endpoint public.
                        // We did this because of the public website pages which need to access the settings.
                        // It's possible we'll create another GraphQL field, made for this exact purpose.
                        // auth !== false && (await checkBasePermissions(context));
                        return context.pageBuilder.settings.dataLoaders.get.load({
                            PK: this.PK(options),
                            SK: this.SK
                        });
                    },
                    async update(next, options) {
                        options?.auth !== false && (await checkBasePermissions(context));

                        let current = await this.get();
                        if (!current) {
                            current = await new DefaultSettingsModel().populate({}).toJSON();
                            await db.create({
                                ...defaults.db,
                                data: {
                                    ...current,
                                    PK: this.PK(options),
                                    SK: this.SK,
                                    TYPE,
                                    type: "default",
                                    tenant: security.getTenant().id,
                                    locale: i18nContent.getLocale.id
                                }
                            });
                        }

                        const settings = new DefaultSettingsModel()
                            .populate(current)
                            .populate(next);
                        await settings.validate();

                        const data = await settings.toJSON();

                        await executeHookCallbacks(hookPlugins, "beforeUpdate", context, data);

                        await db.update({
                            ...defaults.db,
                            query: { PK: this.PK(options), SK: this.SK },
                            data
                        });

                        await executeHookCallbacks(hookPlugins, "afterUpdate", context, data);

                        return settings.toJSON();
                    }
                },

                // Contains the information related to app's installation state (installed or not installed).
                // Note that these settings are not stored per-locale, only per-tenant.
                install: {
                    PK: () => `${getPKPrefix(context, { includeLocale: false })}SETTINGS`,
                    SK: "install",
                    async get() {
                        return context.pageBuilder.settings.dataLoaders.get.load({
                            PK: this.PK(),
                            SK: this.SK
                        });
                    },
                    async update(next) {
                        let current = await this.get();
                        if (!current) {
                            current = await new InstallSettingsModel().populate({}).toJSON();
                            await db.create({
                                ...defaults.db,
                                data: {
                                    ...current,
                                    PK: this.PK(),
                                    SK: this.SK,
                                    TYPE,
                                    type: "install",
                                    tenant: security.getTenant().id,
                                    locale: i18nContent.getLocale.id
                                }
                            });
                        }

                        const settings = new InstallSettingsModel()
                            .populate(current)
                            .populate(next);
                        await settings.validate();

                        const data = await settings.toJSON();

                        await db.update({
                            ...defaults.db,
                            query: { PK: this.PK(), SK: this.SK },
                            data
                        });

                        return settings.toJSON();
                    }
                }
            }
        };
    }
};

export default plugin;
