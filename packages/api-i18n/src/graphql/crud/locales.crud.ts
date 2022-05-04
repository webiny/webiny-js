import WebinyError from "@webiny/error";
import {
    I18NContext,
    I18NLocaleData,
    I18NLocalesStorageOperations,
    LocalesCRUD,
    OnAfterCreateLocaleTopicParams,
    OnAfterDeleteLocaleTopicParams,
    OnAfterUpdateLocaleTopicParams,
    OnBeforeCreateLocaleTopicParams,
    OnBeforeDeleteLocaleTopicParams,
    OnBeforeUpdateLocaleTopicParams
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { NotAuthorizedError } from "@webiny/api-security";
import { createTopic } from "@webiny/pubsub";

export interface CreateLocalesCrudParams {
    context: I18NContext;
    storageOperations: I18NLocalesStorageOperations;
}
export const createLocalesCrud = (params: CreateLocalesCrudParams): LocalesCRUD => {
    const { storageOperations, context } = params;

    const onBeforeCreate = createTopic<OnBeforeCreateLocaleTopicParams>();
    const onAfterCreate = createTopic<OnAfterCreateLocaleTopicParams>();
    const onBeforeUpdate = createTopic<OnBeforeUpdateLocaleTopicParams>();
    const onAfterUpdate = createTopic<OnAfterUpdateLocaleTopicParams>();
    const onBeforeDelete = createTopic<OnBeforeDeleteLocaleTopicParams>();
    const onAfterDelete = createTopic<OnAfterDeleteLocaleTopicParams>();

    return {
        onBeforeCreate,
        onAfterCreate,
        onBeforeUpdate,
        onAfterUpdate,
        onBeforeDelete,
        onAfterDelete,
        async getDefaultLocale() {
            let locale: I18NLocaleData | null = null;
            try {
                locale = await storageOperations.getDefault();
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
                locale = await storageOperations.get(code);
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
        async createLocale(input) {
            const { security, tenancy } = context;
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

            const tenant = tenancy.getCurrentTenant().id;

            const locale: I18NLocaleData = {
                ...input,
                default: input.default === true,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                tenant,
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeCreate.publish({
                    context,
                    locale,
                    tenant
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
                await onAfterCreate.publish({
                    context,
                    locale: result,
                    tenant
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
            const { security, tenancy } = context;

            const permission = await security.getPermission("i18n.locale");

            if (!permission) {
                throw new NotAuthorizedError();
            }
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
                : await storageOperations.getDefault();
            if (!defaultLocale) {
                throw new NotFoundError(`Missing default locale.`);
            }

            const tenant = tenancy.getCurrentTenant().id;

            const locale: I18NLocaleData = {
                ...original,
                ...input,
                createdOn: original.createdOn ? original.createdOn : new Date().toISOString(),
                webinyVersion: context.WEBINY_VERSION
            };

            try {
                await onBeforeUpdate.publish({
                    context,
                    locale,
                    tenant,
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
                await onAfterUpdate.publish({
                    context,
                    locale: result,
                    tenant,
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
            const { security, tenancy } = context;

            const permission = await security.getPermission("i18n.locale");

            if (!permission) {
                throw new NotAuthorizedError();
            }
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
                await onBeforeDelete.publish({
                    context,
                    locale,
                    tenant
                });
                await storageOperations.delete({
                    locale
                });
                await onAfterDelete.publish({
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
