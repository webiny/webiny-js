import {
    BlockCategoriesCrud,
    BlockCategory,
    BlockCategoryStorageOperationsListParams,
    BlockCategoryStorageOperationsGetParams,
    OnAfterBlockCategoryCreateTopicParams,
    OnAfterBlockCategoryDeleteTopicParams,
    OnAfterBlockCategoryUpdateTopicParams,
    OnBeforeBlockCategoryCreateTopicParams,
    OnBeforeBlockCategoryDeleteTopicParams,
    OnBeforeBlockCategoryUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PbContext
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import {
    createBlockCategoryCreateValidation,
    createBlockCategoryUpdateValidation
} from "~/graphql/crud/blockCategories/validation";
import { createZodError, removeUndefinedValues } from "@webiny/utils";
import { BlockCategoriesPermissions } from "~/graphql/crud/permissions/BlockCategoriesPermissions";

export interface CreateBlockCategoriesCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    blockCategoriesPermissions: BlockCategoriesPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createBlockCategoriesCrud = (
    params: CreateBlockCategoriesCrudParams
): BlockCategoriesCrud => {
    const { context, storageOperations, blockCategoriesPermissions, getLocaleCode, getTenantId } =
        params;

    const onBeforeBlockCategoryCreate = createTopic<OnBeforeBlockCategoryCreateTopicParams>();
    const onAfterBlockCategoryCreate = createTopic<OnAfterBlockCategoryCreateTopicParams>();
    const onBeforeBlockCategoryUpdate = createTopic<OnBeforeBlockCategoryUpdateTopicParams>();
    const onAfterBlockCategoryUpdate = createTopic<OnAfterBlockCategoryUpdateTopicParams>();
    const onBeforeBlockCategoryDelete = createTopic<OnBeforeBlockCategoryDeleteTopicParams>();
    const onAfterBlockCategoryDelete = createTopic<OnAfterBlockCategoryDeleteTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onBeforeBlockCategoryCreate,
        onAfterBlockCategoryCreate,
        onBeforeBlockCategoryUpdate,
        onAfterBlockCategoryUpdate,
        onBeforeBlockCategoryDelete,
        onAfterBlockCategoryDelete,
        /**
         * This method should return category or null. No error throwing on not found.
         */
        async getBlockCategory(slug, options = { auth: true }) {
            if (!slug) {
                throw new WebinyError({
                    message: "Block category slug cannot be empty!",
                    code: "GET_BLOCK_CATEGORY_EMPTY_SLUG"
                });
            }
            const { auth } = options;

            const params: BlockCategoryStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            };

            if (!auth) {
                return await storageOperations.blockCategories.get(params);
            }

            await blockCategoriesPermissions.ensure({ rwd: "r" });

            let blockCategory: BlockCategory | null = null;
            try {
                blockCategory = await storageOperations.blockCategories.get(params);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not load block category by slug.",
                    ex.code || "GET_BLOCK_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }
            if (!blockCategory) {
                return null;
            }

            await blockCategoriesPermissions.ensure({ owns: blockCategory.createdBy });

            return blockCategory;
        },

        async listBlockCategories() {
            await blockCategoriesPermissions.ensure({ rwd: "r" });

            const params: BlockCategoryStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: ["createdOn_ASC"]
            };

            // If user can only manage own records, add the createdBy to where values.
            if (await blockCategoriesPermissions.canAccessOnlyOwnRecords()) {
                const identity = context.security.getIdentity();
                params.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.blockCategories.list(params);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list block categories by given params.",
                    ex.code || "LIST_BLOCK_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }
        },
        async createBlockCategory(this: PageBuilderContextObject, input) {
            await blockCategoriesPermissions.ensure({ rwd: "w" });

            const validationResult =
                await createBlockCategoryCreateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const existingBlockCategory = await this.getBlockCategory(input.slug, {
                auth: false
            });
            if (existingBlockCategory) {
                throw new NotFoundError(`Category with slug "${input.slug}" already exists.`);
            }

            const identity = context.security.getIdentity();

            const data = removeUndefinedValues(validationResult.data);

            const blockCategory: BlockCategory = {
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
                await onBeforeBlockCategoryCreate.publish({
                    blockCategory
                });
                const result = await storageOperations.blockCategories.create({
                    input: data,
                    blockCategory
                });
                await onAfterBlockCategoryCreate.publish({
                    blockCategory: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create block category.",
                    ex.code || "CREATE_BLOCK_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        blockCategory
                    }
                );
            }
        },
        async updateBlockCategory(this: PageBuilderContextObject, slug, input) {
            await blockCategoriesPermissions.ensure({ rwd: "w" });

            const original = await this.getBlockCategory(slug);
            if (!original) {
                throw new NotFoundError(`Block Category "${slug}" not found.`);
            }

            await blockCategoriesPermissions.ensure({ owns: original.createdBy });

            const validationResult =
                await createBlockCategoryUpdateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const data = removeUndefinedValues(validationResult.data);

            const blockCategory: BlockCategory = {
                ...original,
                ...data
            };
            try {
                await onBeforeBlockCategoryUpdate.publish({
                    original,
                    blockCategory
                });
                const result = await storageOperations.blockCategories.update({
                    input: data,
                    original,
                    blockCategory
                });
                await onAfterBlockCategoryUpdate.publish({
                    original,
                    blockCategory
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update block category.",
                    ex.code || "UPDATE_BLOCK_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        blockCategory
                    }
                );
            }
        },
        async deleteBlockCategory(this: PageBuilderContextObject, slug) {
            await blockCategoriesPermissions.ensure({ rwd: "d" });

            const blockCategory = await this.getBlockCategory(slug);
            if (!blockCategory) {
                throw new NotFoundError(`Block Category "${slug}" not found.`);
            }

            await blockCategoriesPermissions.ensure({ owns: blockCategory.createdBy });

            // Before deleting, we need to check if there are any page blocks in this block category.
            // If so, prevent delete operation.
            const pageBlocks = await this.listPageBlocks({
                where: {
                    blockCategory: slug
                }
            });

            if (pageBlocks?.length > 0) {
                throw new WebinyError(
                    "Cannot delete block category because some page blocks are linked to it.",
                    "BLOCK_CATEGORY_HAS_LINKED_BLOCKS"
                );
            }

            try {
                await onBeforeBlockCategoryDelete.publish({
                    blockCategory
                });
                const result = await storageOperations.blockCategories.delete({
                    blockCategory
                });
                await onAfterBlockCategoryDelete.publish({
                    blockCategory: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete block category.",
                    ex.code || "DELETE_BLOCK_CATEGORY_ERROR",
                    {
                        ...(ex.data || {}),
                        blockCategory
                    }
                );
            }
        }
    };
};
