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
import {
    createBlockCategoryCreateValidation,
    createBlockCategoryUpdateValidation
} from "~/graphql/crud/blockCategories/validation";
import { createZodError, removeUndefinedValues } from "@webiny/utils";
import canAccessAllRecords from "~/graphql/crud/utils/canAccessAllRecords";

const PERMISSION_NAME = "pb.blockCategory";

export interface CreateBlockCategoriesCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createBlockCategoriesCrud = (
    params: CreateBlockCategoriesCrudParams
): BlockCategoriesCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    const getPermissions = (name: string) => context.security.getPermissions(name);

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

            await context.i18n.checkI18NContentPermission();

            let permissions: PbSecurityPermission[] = [];
            const blocksPermissions = await getPermissions(PERMISSION_NAME);
            if (blocksPermissions.length && hasRwd(blocksPermissions, "r")) {
                permissions = blocksPermissions;
            }

            if (!permissions.length) {
                throw new NotAuthorizedError();
            }

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

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, blockCategory);

            return blockCategory;
        },

        async listBlockCategories() {
            await context.i18n.checkI18NContentPermission();

            let permissions: PbSecurityPermission[] = [];
            const blocksPermissions = await getPermissions(PERMISSION_NAME);
            if (blocksPermissions.length && hasRwd(blocksPermissions, "r")) {
                permissions = blocksPermissions;
            }

            if (!permissions.length) {
                throw new NotAuthorizedError();
            }

            const params: BlockCategoryStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: ["createdOn_ASC"]
            };
            // If user can only manage own records, add the createdBy to where values.
            if (!canAccessAllRecords(permissions)) {
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
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const validationResult = await createBlockCategoryCreateValidation().safeParseAsync(
                input
            );
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
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.getBlockCategory(slug);
            if (!original) {
                throw new NotFoundError(`Block Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, original);

            const validationResult = await createBlockCategoryUpdateValidation().safeParseAsync(
                input
            );
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
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const blockCategory = await this.getBlockCategory(slug);
            if (!blockCategory) {
                throw new NotFoundError(`Block Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, blockCategory);

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
