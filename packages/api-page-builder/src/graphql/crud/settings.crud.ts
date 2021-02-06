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
import { DefaultSettingsModel, InstallSettingsModel } from "@webiny/api-page-builder/utils/models";
import merge from "lodash/merge";
import Error from "@webiny/error";

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
    async apply(context) {
        const { db, security, i18nContent } = context;

        const hookPlugins = context.plugins.byType<SettingsHookPlugin>("pb-settings-hook");

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
                        }) as Promise<DefaultSettings>;
                    },
                    async getDefault(options) {
                        const allTenants = await this.get({ tenant: false, locale: false });
                        const tenantAllLocales = await this.get({
                            tenant: options?.tenant,
                            locale: false
                        });
                        if (!allTenants && !tenantAllLocales) {
                            return null;
                        }

                        return merge({}, allTenants, tenantAllLocales);
                    },
                    async update(rawData, options) {
                        options?.auth !== false && (await checkBasePermissions(context));

                        let previous = await this.get(options);
                        if (!previous) {
                            previous = await new DefaultSettingsModel().populate({}).toJSON();

                            let tenant = undefined,
                                locale = undefined;
                            if (options?.tenant !== false) {
                                tenant = options.tenant || security.getTenant().id;
                            }
                            if (options?.locale !== false) {
                                locale = options.locale || i18nContent.getLocale().code;
                            }

                            await db.create({
                                ...defaults.db,
                                data: {
                                    ...previous,
                                    PK: this.PK(options),
                                    SK: this.SK,
                                    TYPE,
                                    type: "default",
                                    tenant,
                                    locale
                                }
                            });
                        }

                        const settingsModel = new DefaultSettingsModel()
                            .populate(previous)
                            .populate(rawData);
                        await settingsModel.validate();

                        const next = await settingsModel.toJSON();

                        // Before continuing, let's check for differences that matter.

                        // 1. Check differences in `pages` property (`home`, `notFound`). If there are
                        // differences, check if the pages can be set as the new `specialType` page, and then,
                        // after save, make sure to trigger events, on which other plugins can do their tasks.
                        const specialTypes = ["home", "notFound"];

                        const changedPages = [];
                        for (let i = 0; i < specialTypes.length; i++) {
                            const specialType = specialTypes[i];
                            const p = previous?.pages?.[specialType];
                            const n = next?.pages?.[specialType];
                            if (p !== n) {
                                if (!n) {
                                    throw new Error(
                                        `Cannot unset "${specialType}" page. Please provide a new page if you want to unset current one.`,
                                        "CANNOT_UNSET_SPECIAL_PAGE"
                                    );
                                }

                                const page = await context.pageBuilder.pages.getPublishedById({
                                    id: n
                                });

                                changedPages.push([specialType, p, n, page]);
                            }
                        }

                        await executeHookCallbacks(
                            hookPlugins,
                            "beforeUpdate",
                            context,
                            previous,
                            next,
                            {
                                diff: {
                                    pages: changedPages
                                }
                            }
                        );

                        await db.update({
                            ...defaults.db,
                            query: { PK: this.PK(options), SK: this.SK },
                            data: next
                        });

                        await executeHookCallbacks(
                            hookPlugins,
                            "afterUpdate",
                            context,
                            previous,
                            next,
                            {
                                diff: {
                                    pages: changedPages
                                }
                            }
                        );

                        return next;
                    }
                },

                // Contains the information related to app's installation state (installed or not installed).
                // Note that these settings are not stored per-locale, only per-tenant.
                install: {
                    PK: () => `${getPKPrefix(context, { locale: false })}SETTINGS`,
                    SK: "install",
                    async get() {
                        return context.pageBuilder.settings.dataLoaders.get.load({
                            PK: this.PK(),
                            SK: this.SK
                        }) as Promise<InstallSettings>;
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
                                    locale: i18nContent.getLocale().code
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
