/**
 * Package @commodo/fields does not have types.
 */
// @ts-ignore
import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
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

const CreateDataModel = withFields({
    slug: string({ validation: validation.create("required,slug") }),
    name: string({ validation: validation.create("required,minLength:1,maxLength:100") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("minLength:1,maxLength:100") })
})();

const PERMISSION_NAME = "pb.block";

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

    const getPermission = (name: string) => context.security.getPermission(name);

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
            const { auth } = options;

            if (slug === "") {
                throw new WebinyError(
                    "Could not load block category by empty slug.",
                    "GET_BLOCK_CATEGORY_ERROR"
                );
            }

            const params: BlockCategoryStorageOperationsGetParams = {
                where: {
                    slug,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            };

            if (auth === false) {
                return await storageOperations.blockCategories.get(params);
            }

            await context.i18n.checkI18NContentPermission();

            let permission;
            const blocksPermission = await getPermission(PERMISSION_NAME);
            if (blocksPermission && hasRwd(blocksPermission, "r")) {
                permission = blocksPermission;
            }

            if (!permission) {
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
            checkOwnPermissions(identity, permission, blockCategory);

            return blockCategory;
        },

        async listBlockCategories() {
            await context.i18n.checkI18NContentPermission();

            let permission: PbSecurityPermission | null = null;
            const blocksPermission = await getPermission(PERMISSION_NAME);
            if (blocksPermission && hasRwd(blocksPermission, "r")) {
                permission = blocksPermission;
            }

            if (!permission) {
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
            if (permission.own) {
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

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const existingBlockCategory = await this.getBlockCategory(input.slug, {
                auth: false
            });
            if (existingBlockCategory) {
                throw new NotFoundError(`Category with slug "${input.slug}" already exists.`);
            }

            const identity = context.security.getIdentity();

            const data: BlockCategory = await createDataModel.toJSON();

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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            const original = await this.getBlockCategory(slug);
            if (!original) {
                throw new NotFoundError(`Block Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            const data = await updateDataModel.toJSON({ onlyDirty: true });

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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const blockCategory = await this.getBlockCategory(slug);
            if (!blockCategory) {
                throw new NotFoundError(`Block Category "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, blockCategory);

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
