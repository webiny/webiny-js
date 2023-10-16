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
    PbContext
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import {
    createCategoryCreateValidation,
    createCategoryUpdateValidation
} from "~/graphql/crud/categories/validation";
import { createZodError, removeUndefinedValues } from "@webiny/utils";
import { CategoriesPermissions } from "~/graphql/crud/permissions/CategoriesPermissions";
import { PagesPermissions } from "~/graphql/crud/permissions/PagesPermissions";

export interface CreateCategoriesCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    categoriesPermissions: CategoriesPermissions;
    pagesPermissions: PagesPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createCategoriesCrud = (params: CreateCategoriesCrudParams): CategoriesCrud => {
    const {
        context,
        storageOperations,
        categoriesPermissions,
        pagesPermissions,
        getLocaleCode,
        getTenantId
    } = params;

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
            const { auth, locale } = options;

            const params: CategoryStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: getTenantId(),
                    locale: locale || getLocaleCode()
                }
            };

            if (auth === false) {
                return await storageOperations.categories.get(params);
            }

            try {
                await categoriesPermissions.ensure({ rwd: "r" });
            } catch {
                // If we don't have the necessary `categoryPermission` permission, let's still check if the
                // user has the permission to write pages. If so, we still want to allow listing categories,
                // because this is needed in order to create a page.
                await pagesPermissions.ensure({ rwd: "w" });
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

            await categoriesPermissions.ensure({ owns: category.createdBy });

            return category;
        },

        async listCategories() {
            try {
                await categoriesPermissions.ensure({ rwd: "r" });
            } catch {
                // If we don't have the necessary `categoryPermission` permission, let's still check if the
                // user has the permission to write pages. If so, we still want to allow listing categories,
                // because this is needed in order to create a page.
                await pagesPermissions.ensure({ rwd: "w" });
            }

            const params: CategoryStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: ["createdOn_ASC"]
            };
            // If user can only manage own records, add the createdBy to where values.
            if (await categoriesPermissions.canAccessOnlyOwnRecords()) {
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
            await categoriesPermissions.ensure({ rwd: "w" });

            const validationResult = await createCategoryCreateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const existingCategory = await this.getCategory(input.slug, {
                auth: false,
                locale: input.locale
            });
            if (existingCategory) {
                throw new NotFoundError(`Category with slug "${input.slug}" already exists.`);
            }

            const identity = context.security.getIdentity();

            const data = validationResult.data;

            const category: Category = {
                ...data,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                },
                tenant: getTenantId(),
                locale: input.locale || getLocaleCode()
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
            await categoriesPermissions.ensure({ rwd: "w" });

            const original = await this.getCategory(slug);
            if (!original) {
                throw new NotFoundError(`Category "${slug}" not found.`);
            }

            await categoriesPermissions.ensure({ owns: original.createdBy });

            const validationResult = await createCategoryUpdateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const data = removeUndefinedValues(validationResult.data);

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
            await categoriesPermissions.ensure({ rwd: "d" });

            const category = await this.getCategory(slug);
            if (!category) {
                throw new NotFoundError(`Category "${slug}" not found.`);
            }

            await categoriesPermissions.ensure({ owns: category.createdBy });

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
