/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import {
    CategoriesCrud,
    Category,
    CategoryStorageOperationsGetParams,
    CategoryStorageOperationsListParams,
    OnCategoryAfterCreateTopicParams,
    OnCategoryAfterDeleteTopicParams,
    OnCategoryAfterUpdateTopicParams,
    OnCategoryBeforeCreateTopicParams,
    OnCategoryBeforeDeleteTopicParams,
    OnCategoryBeforeUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PbContext,
    PbSecurityPermission
} from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";
import { NotFoundError } from "@webiny/handler-graphql";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

const CreateDataModel = withFields({
    slug: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    name: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    url: string({ validation: validation.create("required,minLength:1,maxLength:100") }),
    layout: string({ validation: validation.create("required,minLength:1,maxLength:100") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:1,maxLength:100") }),
    url: string({ validation: validation.create("minLength:1,maxLength:100") }),
    layout: string({ validation: validation.create("minLength:1,maxLength:100") })
})();

const PERMISSION_NAME = "pb.category";

export interface CreateCategoriesCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createCategoriesCrud = (params: CreateCategoriesCrudParams): CategoriesCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    const getPermission = (name: string) => context.security.getPermission(name);

    const onCategoryBeforeCreate = createTopic<OnCategoryBeforeCreateTopicParams>(
        "pageBuilder.onCategoryBeforeCreate"
    );
    const onCategoryAfterCreate = createTopic<OnCategoryAfterCreateTopicParams>(
        "pageBuilder.onCategoryAfterCreate"
    );
    const onCategoryBeforeUpdate = createTopic<OnCategoryBeforeUpdateTopicParams>(
        "pageBuilder.onCategoryBeforeUpdate"
    );
    const onCategoryAfterUpdate = createTopic<OnCategoryAfterUpdateTopicParams>(
        "pageBuilder.onCategoryAfterUpdate"
    );
    const onCategoryBeforeDelete = createTopic<OnCategoryBeforeDeleteTopicParams>(
        "pageBuilder.onCategoryBeforeDelete"
    );
    const onCategoryAfterDelete = createTopic<OnCategoryAfterDeleteTopicParams>(
        "pageBuilder.onCategoryAfterDelete"
    );

    return {
        /**
         * Lifecycle events - deprecated in 5.34.0 - will be removed from 5.36.0
         */
        onBeforeCategoryCreate: onCategoryBeforeCreate,
        onAfterCategoryCreate: onCategoryAfterCreate,
        onBeforeCategoryUpdate: onCategoryBeforeUpdate,
        onAfterCategoryUpdate: onCategoryAfterUpdate,
        onBeforeCategoryDelete: onCategoryBeforeDelete,
        onAfterCategoryDelete: onCategoryAfterDelete,
        /**
         * Introduced in 5.34.0
         */
        onCategoryBeforeCreate,
        onCategoryAfterCreate,
        onCategoryBeforeUpdate,
        onCategoryAfterUpdate,
        onCategoryBeforeDelete,
        onCategoryAfterDelete,
        /**
         * This method should return category or null. No error throwing on not found.
         */
        async getCategory(slug, options = { auth: true }) {
            const { auth } = options;

            const params: CategoryStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            };

            if (auth === false) {
                return await storageOperations.categories.get(params);
            }

            await context.i18n.checkI18NContentPermission();

            let permission;
            const categoryPermission = await getPermission("pb.category");
            if (categoryPermission && hasRwd(categoryPermission, "r")) {
                permission = categoryPermission;
            } else {
                // If we don't have the necessary `categoryPermission` permission, let's still check if the
                // user has the permission to write pages. If so, we still want to allow listing categories,
                // because this is needed in order to create a page.
                const pagePermission = await getPermission("pb.page");
                if (pagePermission && hasRwd(pagePermission, "w")) {
                    permission = pagePermission;
                }
            }

            if (!permission) {
                throw new NotAuthorizedError();
            }

            let category: Category | null = null;
            try {
                category = await storageOperations.categories.get(params);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load category by slug.",
                    ex.code || "GET_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }
            if (!category) {
                return null;
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, category);

            return category;
        },

        async listCategories() {
            await context.i18n.checkI18NContentPermission();

            let permission: PbSecurityPermission | null = null;
            const categoryPermission = await getPermission("pb.category");
            if (categoryPermission && hasRwd(categoryPermission, "r")) {
                permission = categoryPermission;
            } else {
                // If we don't have the necessary `categoryPermission` permission, let's still check if the
                // user has the permission to write pages. If so, we still want to allow listing categories,
                // because this is needed in order to create a page.
                const pagePermission = await getPermission("pb.page");
                if (pagePermission && hasRwd(pagePermission, "w")) {
                    permission = pagePermission;
                }
            }

            if (!permission) {
                throw new NotAuthorizedError();
            }

            const params: CategoryStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: ["createdOn_ASC"]
            };
            // If user can only manage own records, add the createdBy to where values.
            if (permission.own) {
                const identity = context.security.getIdentity();

                params.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.categories.list(params);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list categories by given params.",
                    ex.code || "LIST_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }
        },
        async createCategory(this: PageBuilderContextObject, input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const existingCategory = await this.getCategory(input.slug, {
                auth: false
            });
            if (existingCategory) {
                throw new NotFoundError(`Category with slug "${input.slug}" already exists.`);
            }

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const identity = context.security.getIdentity();

            const data: Category = await createDataModel.toJSON();

            const category: Category = {
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
                await onCategoryBeforeCreate.publish({
                    category
                });
                const result = await storageOperations.categories.create({
                    input: data,
                    category
                });
                await onCategoryAfterCreate.publish({
                    category: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create category.",
                    ex.code || "CREATE_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        category
                    }
                );
            }
        },
        async updateCategory(this: PageBuilderContextObject, slug, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.getCategory(slug);
            if (!original) {
                throw new NotFoundError(`Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            const data = await updateDataModel.toJSON({ onlyDirty: true });

            const category: Category = {
                ...original,
                ...data
            };
            try {
                await onCategoryBeforeUpdate.publish({
                    original,
                    category
                });
                const result = await storageOperations.categories.update({
                    input: data,
                    original,
                    category
                });
                await onCategoryAfterUpdate.publish({
                    original,
                    category
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update category.",
                    ex.code || "UPDATE_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        category
                    }
                );
            }
        },
        async deleteCategory(this: PageBuilderContextObject, slug) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const category = await this.getCategory(slug);
            if (!category) {
                throw new NotFoundError(`Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, category);

            // Before deleting, let's check if there is a page that's in this category.
            // If so, let's prevent this.
            const [pages] = await this.listLatestPages(
                {
                    where: {
                        category: category.slug
                    },
                    limit: 1
                },
                {
                    auth: false
                }
            );
            if (pages.length > 0) {
                throw new WebinyError(
                    "Cannot delete category because some pages are linked to it.",
                    "CANNOT_DELETE_CATEGORY_PAGE_EXISTING"
                );
            }

            try {
                await onCategoryBeforeDelete.publish({
                    category
                });
                const result = await storageOperations.categories.delete({
                    category
                });
                await onCategoryAfterDelete.publish({
                    category: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete category.",
                    ex.code || "DELETE_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        category
                    }
                );
            }
        }
    };
};
