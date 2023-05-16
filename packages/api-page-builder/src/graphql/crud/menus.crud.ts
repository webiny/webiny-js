import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import prepareMenuItems from "./menus/prepareMenuItems";
import WebinyError from "@webiny/error";
import {
    MenuStorageOperationsGetParams,
    Menu,
    PbContext,
    MenuStorageOperationsListParams,
    OnMenuBeforeCreateTopicParams,
    OnMenuAfterCreateTopicParams,
    OnMenuBeforeUpdateTopicParams,
    OnMenuAfterUpdateTopicParams,
    OnMenuBeforeDeleteTopicParams,
    OnMenuAfterDeleteTopicParams,
    MenusCrud,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PbSecurityPermission
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import {
    createMenuCreateValidation,
    createMenuUpdateValidation
} from "~/graphql/crud/menus/validation";
import { createZodError, removeUndefinedValues } from "@webiny/utils";
import canAccessAllRecords from "~/graphql/crud/utils/canAccessAllRecords";

const PERMISSION_NAME = "pb.menu";

export interface CreateMenuCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createMenuCrud = (params: CreateMenuCrudParams): MenusCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    // create
    const onMenuBeforeCreate = createTopic<OnMenuBeforeCreateTopicParams>(
        "pageBuilder.onMenuBeforeCreate"
    );
    const onMenuAfterCreate = createTopic<OnMenuAfterCreateTopicParams>(
        "pageBuilder.onMenuAfterCreate"
    );
    // update
    const onMenuBeforeUpdate = createTopic<OnMenuBeforeUpdateTopicParams>(
        "pageBuilder.onMenuBeforeUpdate"
    );
    const onMenuAfterUpdate = createTopic<OnMenuAfterUpdateTopicParams>(
        "pageBuilder.onMenuAfterUpdate"
    );
    // delete
    const onMenuBeforeDelete = createTopic<OnMenuBeforeDeleteTopicParams>(
        "pageBuilder.onMenuBeforeDelete"
    );
    const onMenuAfterDelete = createTopic<OnMenuAfterDeleteTopicParams>(
        "pageBuilder.onMenuAfterDelete"
    );

    return {
        /**
         * Deprecated in 5.34.0 - will be removed in 5.36.0
         */
        onBeforeMenuCreate: onMenuBeforeCreate,
        onAfterMenuCreate: onMenuAfterCreate,
        onBeforeMenuUpdate: onMenuBeforeUpdate,
        onAfterMenuUpdate: onMenuAfterUpdate,
        onBeforeMenuDelete: onMenuBeforeDelete,
        onAfterMenuDelete: onMenuAfterDelete,
        /**
         *
         */
        onMenuBeforeCreate,
        onMenuAfterCreate,
        onMenuBeforeUpdate,
        onMenuAfterUpdate,
        onMenuBeforeDelete,
        onMenuAfterDelete,
        async getMenu(slug, options) {
            let permissions: PbSecurityPermission[] = [];
            const { auth = true } = options || {};
            if (auth !== false) {
                permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                    rwd: "r"
                });
            }

            const params: MenuStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            };

            let menu: Menu;

            try {
                menu = await storageOperations.menus.get(params);
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

            if (!permissions.length) {
                return menu;
            }
            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, menu);

            return menu;
        },

        /**
         * Used to fetch menu data from a public website. Items are prepared for consumption too.
         * @param slug
         */
        async getPublicMenu(this: PageBuilderContextObject, slug) {
            const menu = await this.getMenu(slug, {
                auth: false
            });

            if (!menu) {
                throw new NotFoundError();
            }

            menu.items = await prepareMenuItems({ menu, context });
            return menu;
        },

        async listMenus(params) {
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const { sort } = params || {};

            const listParams: MenuStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_ASC"]
            };

            // If user can only manage own records, let's add that to the listing.
            if (!canAccessAllRecords(permissions)) {
                const identity = context.security.getIdentity();
                listParams.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.menus.list(listParams);
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

        async createMenu(input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const validationResult = await createMenuCreateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const data = validationResult.data;

            const existing = await storageOperations.menus.get({
                where: {
                    slug: data.slug,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });
            if (existing) {
                throw new WebinyError(`Menu "${data.slug}" already exists.`);
            }

            const identity = context.security.getIdentity();

            const menu: Menu = {
                ...data,
                items: data.items || [],
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                },
                tenant: getTenantId(),
                locale: getLocaleCode()
            };

            try {
                await onMenuBeforeCreate.publish({
                    input: data,
                    menu
                });

                const result = await storageOperations.menus.create({
                    input: data,
                    menu
                });
                await onMenuAfterCreate.publish({
                    input: data,
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

        async updateMenu(this: PageBuilderContextObject, slug, input) {
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.getMenu(slug);
            if (!original) {
                throw new NotFoundError(`Menu "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, original);

            const validationResult = await createMenuUpdateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const data = removeUndefinedValues(validationResult.data);

            const menu = {
                ...original,
                ...data
            };

            try {
                await onMenuBeforeUpdate.publish({
                    original,
                    menu
                });

                const result = await storageOperations.menus.update({
                    input: data,
                    original,
                    menu
                });

                await onMenuAfterUpdate.publish({
                    original,
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
        async deleteMenu(this: PageBuilderContextObject, slug) {
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const menu = await this.getMenu(slug);
            if (!menu) {
                throw new NotFoundError(`Menu "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, menu);

            try {
                await onMenuBeforeDelete.publish({
                    menu
                });

                const result = await storageOperations.menus.delete({
                    menu
                });

                await onMenuAfterDelete.publish({
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
};
