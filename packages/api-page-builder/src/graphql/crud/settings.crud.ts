import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./utils/defaults";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext, DefaultSettings } from "../../types";
import { NotAuthorizedError } from "@webiny/api-security";
import DataLoader from "dataloader";
import executeCallbacks from "./utils/executeCallbacks";
import { DefaultSettingsModel } from "../../utils/models";
import mergeWith from "lodash/mergeWith";
import Error from "@webiny/error";
import { SettingsPlugin } from "~/plugins/SettingsPlugin";

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
        const { db, tenancy, i18nContent } = context;

        const settingsPlugins = context.plugins.byType<SettingsPlugin>(SettingsPlugin.type);

        context.pageBuilder = {
            ...context.pageBuilder,
            settings: {
                dataLoaders: {
                    get: new DataLoader<{ PK: string; SK: string }, DefaultSettings, string>(
                        async keys => {
                            const results = [];
                            for (let i = 0; i < keys.length; i++) {
                                const { PK, SK } = keys[i];
                                const [[data]] = await db.read<DefaultSettings>({
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

                    async getCurrent() {
                        // With this line commented, we made this endpoint public.
                        // We did this because of the public website pages which need to access the settings.
                        // It's possible we'll create another GraphQL field, made for this exact purpose.
                        // auth !== false && (await checkBasePermissions(context));

                        const current = await context.pageBuilder.settings.default.get({});
                        const defaults = await context.pageBuilder.settings.default.getDefault();

                        return mergeWith({}, defaults, current, (prev, next) => {
                            // No need to use falsy value if we have it set in the default settings.
                            if (prev && !next) {
                                return prev;
                            }
                        });
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
                    async getDefault(options) {
                        const allTenants = await this.get({ tenant: false, locale: false });
                        const tenantAllLocales = await this.get({
                            tenant: options?.tenant,
                            locale: false
                        });
                        if (!allTenants && !tenantAllLocales) {
                            return null;
                        }

                        return mergeWith({}, allTenants, tenantAllLocales, (next, prev) => {
                            // No need to use falsy value if we have it set in the default settings.
                            if (prev && !next) {
                                return prev;
                            }
                        });
                    },
                    async update(rawData, options) {
                        options?.auth !== false && (await checkBasePermissions(context));

                        let previous = await this.get(options);
                        if (!previous) {
                            previous = await new DefaultSettingsModel().populate({}).toJSON();

                            let tenant = undefined,
                                locale = undefined;
                            if (options?.tenant !== false) {
                                tenant = options?.tenant || tenancy.getCurrentTenant().id;
                            }
                            if (options?.locale !== false) {
                                locale = options?.locale || i18nContent.getLocale().code;
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
                                // Only throw if previously we had a page (p), and now all of a sudden
                                // we don't (!n). Allows updating settings without sending these.
                                if (p && !n) {
                                    throw new Error(
                                        `Cannot unset "${specialType}" page. Please provide a new page if you want to unset current one.`,
                                        "CANNOT_UNSET_SPECIAL_PAGE"
                                    );
                                }

                                // Only load if the next page (n) has been sent, which is always a
                                // must if previously a page was defined (p).
                                if (n) {
                                    const page = await context.pageBuilder.pages.getPublishedById({
                                        id: n
                                    });

                                    changedPages.push([specialType, p, n, page]);
                                }
                            }
                        }

                        await executeCallbacks<SettingsPlugin["beforeUpdate"]>(
                            settingsPlugins,
                            "beforeUpdate",
                            {
                                context,
                                previousSettings: previous,
                                nextSettings: next,
                                meta: {
                                    diff: {
                                        pages: changedPages
                                    }
                                }
                            }
                        );

                        await db.update({
                            ...defaults.db,
                            query: { PK: this.PK(options), SK: this.SK },
                            data: next
                        });

                        await executeCallbacks<SettingsPlugin["afterUpdate"]>(
                            settingsPlugins,
                            "afterUpdate",
                            {
                                context,
                                previousSettings: previous,
                                nextSettings: next,
                                meta: {
                                    diff: {
                                        pages: changedPages
                                    }
                                }
                            }
                        );

                        return next;
                    }
                }
            }
        };
    }
};

export default plugin;
