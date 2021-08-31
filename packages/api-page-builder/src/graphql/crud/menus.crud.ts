import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import {
    MenuStorageOperationsGetParams,
    Menu,
    PbContext,
    MenuStorageOperationsListParams,
    MenuStorageOperations
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import Error from "@webiny/error";
import { validation } from "@webiny/validation";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import executeCallbacks from "./utils/executeCallbacks";
import prepareMenuItems from "./menus/prepareMenuItems";
import { MenuPlugin } from "~/plugins/MenuPlugin";
import WebinyError from "@webiny/error";
import { MenuStorageOperationsProviderPlugin } from "~/plugins/MenuStorageOperationsProviderPlugin";
import { createStorageOperations } from "./storageOperations";

const CreateDataModel = withFields({
    title: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    slug: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    description: string({ validation: validation.create("maxLength:100") }),
    items: object()
})();

const UpdateDataModel = withFields({
    title: string({ validation: validation.create("minLength:1,maxLength:100") }),
    description: string({ validation: validation.create("maxLength:100") }),
    items: object()
})();

const PERMISSION_NAME = "pb.menu";

export default new ContextPlugin<PbContext>(async context => {
    /**
     * If pageBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.pageBuilder) {
        console.log("Missing pageBuilder on context. Skipping Menus crud.");
        return;
    }

    const storageOperations = await createStorageOperations<MenuStorageOperations>(
        context,
        MenuStorageOperationsProviderPlugin.type
    );

    const hookPlugins = context.plugins.byType<MenuPlugin>(MenuPlugin.type);

    context.pageBuilder.menus = {
        async get(slug) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getLocale();
            const params: MenuStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: tenant.id,
                    locale: locale.code
                }
            };

            let menu: Menu;

            try {
                menu = await storageOperations.get(params);
                if (!menu) {
                    return null;
                }
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get menu by slug.",
                    ex.code || "GET_MENU_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, menu);

            return menu;
        },

        /**
         * Used to fetch menu data from a public website. Items are prepared for consumption too.
         * @param slug
         */
        async getPublic(slug) {
            const menu = await context.pageBuilder.menus.get(slug);

            if (!menu) {
                throw new NotFoundError();
            }

            menu.items = await prepareMenuItems({ menu, context });
            return menu;
        },

        async list(params) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getLocale();
            const { sort } = params || {};

            const listParams: MenuStorageOperationsListParams = {
                where: {
                    tenant: tenant.id,
                    locale: locale.code
                },
                sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_ASC"]
            };

            // If user can only manage own records, let's add that to the listing.
            if (permission.own) {
                const identity = context.security.getIdentity();
                listParams.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.list(listParams);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list all menus.",
                    ex.code || "LIST_MENUS_ERROR",
                    {
                        params
                    }
                );
            }
        },

        async create(input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const data: Menu = await createDataModel.toJSON();

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getLocale();

            const existing = await storageOperations.get({
                where: {
                    slug: data.slug,
                    tenant: tenant.id,
                    locale: locale.code
                }
            });
            if (existing) {
                throw new Error(`Menu "${data.slug}" already exists.`);
            }

            const identity = context.security.getIdentity();

            const menu: Menu = {
                ...data,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                },
                tenant: tenant.id,
                locale: locale.code
            };

            try {
                await executeCallbacks<MenuPlugin["beforeCreate"]>(hookPlugins, "beforeCreate", {
                    context,
                    menu
                });
                const result = await storageOperations.create({
                    input: data,
                    menu
                });
                await executeCallbacks<MenuPlugin["afterCreate"]>(hookPlugins, "afterCreate", {
                    context,
                    menu: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create menu.",
                    ex.code || "CREATE_MENU_ERROR",
                    {
                        ...(ex.data || {}),
                        menu
                    }
                );
            }
        },

        async update(slug, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await context.pageBuilder.menus.get(slug);
            if (!original) {
                throw new NotFoundError(`Menu "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            const data: Partial<Menu> = await updateDataModel.toJSON({ onlyDirty: true });

            const menu: Menu = {
                ...original,
                ...data
            };

            try {
                await executeCallbacks<MenuPlugin["beforeUpdate"]>(hookPlugins, "beforeUpdate", {
                    context,
                    menu
                });

                const result = await storageOperations.update({
                    input: data,
                    original,
                    menu
                });

                await executeCallbacks<MenuPlugin["afterUpdate"]>(hookPlugins, "afterUpdate", {
                    context,
                    menu: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update menu.",
                    ex.code || "UPDATE_MENU_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        menu
                    }
                );
            }
        },
        async delete(slug) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const menu = await context.pageBuilder.menus.get(slug);
            if (!menu) {
                throw new NotFoundError(`Menu "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, menu);

            try {
                await executeCallbacks<MenuPlugin["beforeDelete"]>(hookPlugins, "beforeDelete", {
                    context,
                    menu
                });

                const result = await storageOperations.delete({
                    menu
                });

                await executeCallbacks<MenuPlugin["afterDelete"]>(hookPlugins, "afterDelete", {
                    context,
                    menu: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete menu.",
                    ex.code || "DELETE_MENU_ERROR",
                    {
                        ...(ex.data || {}),
                        menu
                    }
                );
            }
        }
    };
});
