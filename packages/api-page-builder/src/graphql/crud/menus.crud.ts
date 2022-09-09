import {
    MenuStorageOperationsGetParams,
    Menu,
    PbContext,
    MenuStorageOperationsListParams,
    OnBeforeMenuCreateTopicParams,
    OnAfterMenuCreateTopicParams,
    OnBeforeMenuUpdateTopicParams,
    OnAfterMenuUpdateTopicParams,
    OnBeforeMenuDeleteTopicParams,
    OnAfterMenuDeleteTopicParams,
    MenusCrud,
    PageBuilderContextObject,
    PageBuilderStorageOperations
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { validation } from "@webiny/validation";
/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
/**
 * Package commodo-fields-object does not have types.
 */
// @ts-ignore
import { object } from "commodo-fields-object";
import prepareMenuItems from "./menus/prepareMenuItems";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

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

export interface CreateMenuCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createMenuCrud = (params: CreateMenuCrudParams): MenusCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    // create
    const onBeforeMenuCreate = createTopic<OnBeforeMenuCreateTopicParams>(
        "pageBuilder.onBeforeMenuCreate"
    );
    const onAfterMenuCreate = createTopic<OnAfterMenuCreateTopicParams>(
        "pageBuilder.onAfterMenuCreate"
    );
    // update
    const onBeforeMenuUpdate = createTopic<OnBeforeMenuUpdateTopicParams>(
        "pageBuilder.onBeforeMenuUpdate"
    );
    const onAfterMenuUpdate = createTopic<OnAfterMenuUpdateTopicParams>(
        "pageBuilder.onAfterMenuUpdate"
    );
    // delete
    const onBeforeMenuDelete = createTopic<OnBeforeMenuDeleteTopicParams>(
        "pageBuilder.onBeforeMenuDelete"
    );
    const onAfterMenuDelete = createTopic<OnAfterMenuDeleteTopicParams>(
        "pageBuilder.onAfterMenuDelete"
    );

    return {
        onBeforeMenuCreate,
        onAfterMenuCreate,
        onBeforeMenuUpdate,
        onAfterMenuUpdate,
        onBeforeMenuDelete,
        onAfterMenuDelete,
        async getMenu(slug, options) {
            let permission = undefined;
            const { auth = true } = options || {};
            if (auth !== false) {
                permission = await checkBasePermissions(context, PERMISSION_NAME, {
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

            if (!permission) {
                return menu;
            }
            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, menu);

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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
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
            if (permission.own) {
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

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const data: Menu = await createDataModel.toJSON();

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
                await onBeforeMenuCreate.publish({
                    input: data,
                    menu
                });

                const result = await storageOperations.menus.create({
                    input: data,
                    menu
                });
                await onAfterMenuCreate.publish({
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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.getMenu(slug);
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
                await onBeforeMenuUpdate.publish({
                    original,
                    menu
                });

                const result = await storageOperations.menus.update({
                    input: data,
                    original,
                    menu
                });

                await onAfterMenuUpdate.publish({
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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const menu = await this.getMenu(slug);
            if (!menu) {
                throw new NotFoundError(`Menu "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, menu);

            try {
                await onBeforeMenuDelete.publish({
                    menu
                });

                const result = await storageOperations.menus.delete({
                    menu
                });

                await onAfterMenuDelete.publish({
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
