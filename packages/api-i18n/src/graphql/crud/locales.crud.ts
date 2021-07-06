import { I18NContext, I18NContextObject, I18NLocale } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import { LocalesStorageOperationsProviderPlugin } from "~/plugins/LocalesStorageOperationsProviderPlugin";

export default new ContextPlugin<I18NContext>(async context => {
    if (!context.i18n) {
        context.i18n = {} as I18NContextObject;
    }
    const pluginType = LocalesStorageOperationsProviderPlugin.type;

    const providerPlugin = context.plugins
        .byType<LocalesStorageOperationsProviderPlugin>(pluginType)
        .find(() => true);

    if (!providerPlugin) {
        throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
            type: pluginType
        });
    }

    const storageOperations = await providerPlugin.provide({
        context
    });

    context.i18n.locales = {
        getDefault: async () => {
            try {
                const locale = await storageOperations.getDefault();
                if (!locale) {
                    throw new NotFoundError(`Default locale  not found.`);
                }
                return locale;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load the default locale.",
                    ex.code || "LOCALE_DEFAULT_ERROR"
                );
            }
        },
        get: async code => {
            try {
                const locale = await storageOperations.get(code);
                if (!locale) {
                    throw new NotFoundError(`Locale "${code}" not found.`);
                }
                return locale;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load the requested locale.",
                    ex.code || "LOCALE_GET_ERROR",
                    {
                        code
                    }
                );
            }
        },

        list: async params => {
            const { where, sort, after, limit = 1000 } = params || {};
            try {
                return await storageOperations.list({
                    where,
                    sort: sort && sort.length ? sort : ["createdOn_DESC"],
                    after,
                    limit
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load the all the locales.",
                    ex.code || "LOCALE_LIST_ERROR"
                );
            }
        },

        create: async input => {
            const { security } = context;

            const permission = await security.getPermission("i18n.locale");

            if (!permission) {
                throw new NotAuthorizedError();
            }

            const original = await storageOperations.get(input.code);

            if (original) {
                throw new WebinyError(`Locale with key "${original.code}" already exists.`);
            }

            const identity = security.getIdentity();

            const defaultLocale = await storageOperations.getDefault();

            const locale: I18NLocale = {
                default: input.default === true,
                code: input.code,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                }
            };

            try {
                await storageOperations.create({
                    locale
                });
                if (locale.default) {
                    await storageOperations.updateDefault({
                        previous: defaultLocale,
                        locale
                    });
                }
                return locale;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create new locale.",
                    ex.code || "LOCALE_CREATE_ERROR",
                    {
                        input,
                        locale,
                        defaultLocale
                    }
                );
            }
        },

        update: async (code, input) => {
            const { i18n, security } = context;

            const permission = await security.getPermission("i18n.locale");

            if (!permission) {
                throw new NotAuthorizedError();
            }
            const original = await i18n.locales.get(code);
            if (!original) {
                throw new NotFoundError(`Locale "${code}" not found.`);
            }
            if (original.default && !input.default) {
                throw new WebinyError(
                    "Cannot unset default locale, please set another locale as default first.",
                    "CANNOT_CHANGE_DEFAULT_LOCALE",
                    {
                        original,
                        input
                    }
                );
            }
            const defaultLocale = original.default
                ? original
                : await storageOperations.getDefault();
            if (!defaultLocale) {
                throw new NotFoundError(`Missing default locale.`);
            }

            const locale: I18NLocale = {
                ...original,
                ...input
            };

            try {
                await storageOperations.update({
                    original,
                    locale
                });
                if (locale.default) {
                    await storageOperations.updateDefault({
                        previous: defaultLocale,
                        locale
                    });
                }
                return locale;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update existing locale.",
                    ex.code || "LOCALE_UPDATE_ERROR",
                    {
                        original,
                        input
                    }
                );
            }
        },
        delete: async code => {
            const { i18n, security } = context;

            const permission = await security.getPermission("i18n.locale");

            if (!permission) {
                throw new NotAuthorizedError();
            }
            const locale = await i18n.locales.get(code);
            if (!locale) {
                throw new NotFoundError(`Locale "${code}" not found.`);
            }

            if (locale.default) {
                throw new WebinyError(
                    "Cannot delete default locale, please set another locale as default first."
                );
            }
            const [allLocales] = await i18n.locales.list();
            if (allLocales.length === 1) {
                throw new WebinyError("Cannot delete the last locale.");
            }
            try {
                await storageOperations.delete({
                    locale
                });
                return locale;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete existing locale.",
                    ex.code || "LOCALE_DELETE_ERROR",
                    {
                        locale
                    }
                );
            }
        }
    };
});
