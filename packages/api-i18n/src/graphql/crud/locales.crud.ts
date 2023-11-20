import WebinyError from "@webiny/error";
import {
    I18NContext,
    I18NLocaleData,
    I18NLocalesStorageOperations,
    LocalesCRUD,
    OnLocaleAfterCreateTopicParams,
    OnLocaleAfterDeleteTopicParams,
    OnLocaleAfterUpdateTopicParams,
    OnLocaleBeforeCreateTopicParams,
    OnLocaleBeforeDeleteTopicParams,
    OnLocaleBeforeUpdateTopicParams
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import { Tenant } from "@webiny/api-tenancy/types";
import { LocalesPermissions } from "./permissions/LocalesPermissions";

export interface CreateLocalesCrudParams {
    context: I18NContext;
    storageOperations: I18NLocalesStorageOperations;
    localesPermissions: LocalesPermissions;
    getTenant: () => Tenant;
}

export const createLocalesCrud = (params: CreateLocalesCrudParams): LocalesCRUD => {
    const { storageOperations, context, localesPermissions, getTenant } = params;

    const getTenantId = () => {
        return getTenant().id;
    };
    // create
    const onLocaleBeforeCreate = createTopic<OnLocaleBeforeCreateTopicParams>(
        "i18n.onLocaleBeforeCreate"
    );
    const onLocaleAfterCreate = createTopic<OnLocaleAfterCreateTopicParams>(
        "i18n.onLocaleAfterCreate"
    );
    // update
    const onLocaleBeforeUpdate = createTopic<OnLocaleBeforeUpdateTopicParams>(
        "i18n.onLocaleBeforeUpdate"
    );
    const onLocaleAfterUpdate = createTopic<OnLocaleAfterUpdateTopicParams>(
        "i18n.onLocaleAfterUpdate"
    );
    // delete
    const onLocaleBeforeDelete = createTopic<OnLocaleBeforeDeleteTopicParams>(
        "i18n.onLocaleBeforeDelete"
    );
    const onLocaleAfterDelete = createTopic<OnLocaleAfterDeleteTopicParams>(
        "i18n.onLocaleAfterDelete"
    );

    return {
        /**
         * Deprecated in 5.34.0
         */
        onBeforeCreate: onLocaleBeforeCreate,
        onAfterCreate: onLocaleAfterCreate,
        onBeforeUpdate: onLocaleBeforeUpdate,
        onAfterUpdate: onLocaleAfterUpdate,
        onBeforeDelete: onLocaleBeforeDelete,
        onAfterDelete: onLocaleAfterDelete,
        /**
         * Introduced in 5.34.0
         */
        onLocaleBeforeCreate,
        onLocaleAfterCreate,
        onLocaleBeforeUpdate,
        onLocaleAfterUpdate,
        onLocaleBeforeDelete,
        onLocaleAfterDelete,
        storageOperations,
        async getDefaultLocale() {
            let locale: I18NLocaleData | null = null;
            try {
                locale = await storageOperations.getDefault({
                    tenant: getTenantId()
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load the default locale.",
                    ex.code || "LOCALE_DEFAULT_ERROR"
                );
            }
            if (!locale) {
                throw new NotFoundError(`Default locale  not found.`);
            }
            return {
                ...locale,
                createdOn: locale.createdOn ? locale.createdOn : new Date().toISOString()
            };
        },
        async getLocale(code) {
            let locale: I18NLocaleData | null = null;
            try {
                locale = await storageOperations.get({
                    tenant: getTenantId(),
                    code
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load the requested locale.",
                    ex.code || "LOCALE_GET_ERROR",
                    {
                        code
                    }
                );
            }

            if (!locale) {
                throw new NotFoundError(`Locale "${code}" not found.`);
            }

            return {
                ...locale,
                createdOn: locale.createdOn ? locale.createdOn : new Date().toISOString()
            };
        },

        async listLocales(params) {
            const { where, sort, after, limit = 1000 } = params || {};
            try {
                return await storageOperations.list({
                    where: {
                        ...(where || {}),
                        tenant: getTenantId()
                    },
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
        async createLocale(input) {
            await localesPermissions.ensure();

            const original = await storageOperations.get({
                tenant: getTenantId(),
                code: input.code
            });

            if (original) {
                throw new WebinyError(`Locale with key "${original.code}" already exists.`);
            }

            const identity = context.security.getIdentity();

            const defaultLocale = await storageOperations.getDefault({
                tenant: getTenantId()
            });

            const locale: I18NLocaleData = {
                ...input,
                default: input.default === true,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                tenant: getTenantId(),
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onLocaleBeforeCreate.publish({
                    context,
                    locale,
                    tenant: getTenantId()
                });
                const result = await storageOperations.create({
                    locale
                });
                if (locale.default) {
                    await storageOperations.updateDefault({
                        previous: defaultLocale,
                        locale: result
                    });
                }

                // We want to reload the internally cached locales after a new locale is created.
                await context.i18n.reloadLocales();

                await onLocaleAfterCreate.publish({
                    context,
                    locale: result,
                    tenant: getTenantId()
                });
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
        async updateLocale(this: LocalesCRUD, code, input) {
            await localesPermissions.ensure();

            const original = await this.getLocale(code);
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
                : await storageOperations.getDefault({
                      tenant: getTenantId()
                  });
            if (!defaultLocale) {
                throw new NotFoundError(`Missing default locale.`);
            }

            const locale: I18NLocaleData = {
                ...original,
                ...input,
                createdOn: original.createdOn ? original.createdOn : new Date().toISOString(),
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onLocaleBeforeUpdate.publish({
                    context,
                    locale,
                    tenant: getTenantId(),
                    original
                });
                const result = await storageOperations.update({
                    original,
                    locale
                });
                if (locale.default && original.default !== locale.default) {
                    await storageOperations.updateDefault({
                        previous: defaultLocale,
                        locale
                    });
                }

                // We want to reload the internally cached locales after a locale is updated.
                await context.i18n.reloadLocales();

                await onLocaleAfterUpdate.publish({
                    context,
                    locale: result,
                    tenant: getTenantId(),
                    original
                });
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
        async deleteLocale(this: LocalesCRUD, code) {
            const { tenancy } = context;

            await localesPermissions.ensure();

            const locale = await this.getLocale(code);
            if (!locale) {
                throw new NotFoundError(`Locale "${code}" not found.`);
            }

            if (locale.default) {
                throw new WebinyError(
                    "Cannot delete default locale, please set another locale as default first."
                );
            }
            const [allLocales] = await this.listLocales();
            if (allLocales.length === 1) {
                throw new WebinyError("Cannot delete the last locale.");
            }

            const tenant = tenancy.getCurrentTenant().id;

            try {
                await onLocaleBeforeDelete.publish({
                    context,
                    locale,
                    tenant
                });
                await storageOperations.delete({
                    locale
                });

                // We want to reload the internally cached locales after a locale is deleted.
                await context.i18n.reloadLocales();

                await onLocaleAfterDelete.publish({
                    context,
                    locale,
                    tenant
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
};
