/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
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
import { validation } from "@webiny/validation";
import {
    OnAfterPageBlockCreateTopicParams,
    OnAfterPageBlockDeleteTopicParams,
    OnAfterPageBlockUpdateTopicParams,
    OnBeforePageBlockCreateTopicParams,
    OnBeforePageBlockDeleteTopicParams,
    OnBeforePageBlockUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageBlock,
    PageBlocksCrud,
    PageBlockStorageOperationsListParams,
    PbContext,
    Page
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    blockCategory: string({ validation: validation.create("required,slug") }),
    content: object({ validation: validation.create("required") }),
    preview: object({ validation: validation.create("required") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    blockCategory: string({ validation: validation.create("slug") }),
    content: object(),
    preview: object()
})();

const PERMISSION_NAME = "pb.block";

export interface CreatePageBlocksCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createPageBlocksCrud = (params: CreatePageBlocksCrudParams): PageBlocksCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    const onBeforePageBlockCreate = createTopic<OnBeforePageBlockCreateTopicParams>();
    const onAfterPageBlockCreate = createTopic<OnAfterPageBlockCreateTopicParams>();
    const onBeforePageBlockUpdate = createTopic<OnBeforePageBlockUpdateTopicParams>();
    const onAfterPageBlockUpdate = createTopic<OnAfterPageBlockUpdateTopicParams>();
    const onBeforePageBlockDelete = createTopic<OnBeforePageBlockDeleteTopicParams>();
    const onAfterPageBlockDelete = createTopic<OnAfterPageBlockDeleteTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onBeforePageBlockCreate,
        onAfterPageBlockCreate,
        onBeforePageBlockUpdate,
        onAfterPageBlockUpdate,
        onBeforePageBlockDelete,
        onAfterPageBlockDelete,

        async getPageBlock(id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            if (id === "") {
                throw new WebinyError(
                    "Could not load page block by empty id.",
                    "GET_PAGE_BLOCK_ERROR"
                );
            }

            const params = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    id
                }
            };

            let pageBlock: PageBlock | null = null;
            try {
                pageBlock = await storageOperations.pageBlocks.get(params);
                if (!pageBlock) {
                    return null;
                }
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get page block by id.",
                    ex.code || "GET_PAGE_BLOCK_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageBlock);

            return pageBlock;
        },

        async listPageBlocks(this: PageBuilderContextObject, params) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const { sort, where } = params || {};

            if (where?.blockCategory) {
                const blockCategory = await this.getBlockCategory(where.blockCategory);

                if (!blockCategory) {
                    throw new NotFoundError(`Block Category not found.`);
                }
            }

            const listParams: PageBlockStorageOperationsListParams = {
                where: {
                    ...where,
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
                const [items] = await storageOperations.pageBlocks.list(listParams);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list all page blocks.",
                    ex.code || "LIST_PAGE_BLOCKS_ERROR",
                    {
                        params
                    }
                );
            }
        },

        async createPageBlock(this: PageBuilderContextObject, input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const blockCategory = await this.getBlockCategory(input.blockCategory);
            if (!blockCategory) {
                throw new NotFoundError(
                    `Cannot create page block because failed to find such block category.`
                );
            }

            const id: string = mdbid();
            const identity = context.security.getIdentity();

            const data: PageBlock = await createDataModel.toJSON();

            const pageBlock: PageBlock = {
                ...data,
                tenant: getTenantId(),
                locale: getLocaleCode(),
                id,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                }
            };

            try {
                await onBeforePageBlockCreate.publish({
                    pageBlock
                });
                const result = await storageOperations.pageBlocks.create({
                    input: data,
                    pageBlock
                });
                await onAfterPageBlockCreate.publish({
                    pageBlock
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create page block.",
                    ex.code || "CREATE_PAGE_BLOCK_ERROR",
                    {
                        ...(ex.data || {}),
                        pageBlock
                    }
                );
            }
        },

        async updatePageBlock(this: PageBuilderContextObject, id, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await this.getPageBlock(id);
            if (!original) {
                throw new NotFoundError(`Page block "${id}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            if (input.hasOwnProperty("blockCategory")) {
                const blockCategory = await this.getBlockCategory(input.blockCategory);
                if (!blockCategory) {
                    throw new NotFoundError(
                        `Cannot update page block because failed to find such block category.`
                    );
                }
            }

            const data = await updateDataModel.toJSON({ onlyDirty: true });

            const pageBlock: PageBlock = {
                ...original,
                ...data
            };

            try {
                await onBeforePageBlockUpdate.publish({
                    original,
                    pageBlock
                });
                const result = await storageOperations.pageBlocks.update({
                    input: data,
                    original,
                    pageBlock
                });
                await onAfterPageBlockUpdate.publish({
                    original,
                    pageBlock: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update page block.",
                    ex.code || "UPDATE_PAGE_BLOCK_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        pageBlock
                    }
                );
            }
        },

        async deletePageBlock(this: PageBuilderContextObject, slug) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const pageBlock = await this.getPageBlock(slug);
            if (!pageBlock) {
                throw new NotFoundError(`Page block "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageBlock);

            try {
                await onBeforePageBlockDelete.publish({
                    pageBlock
                });
                const result = await storageOperations.pageBlocks.delete({
                    pageBlock
                });
                await onAfterPageBlockDelete.publish({
                    pageBlock: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete page block.",
                    ex.code || "DELETE_PAGE_BLOCK_ERROR",
                    {
                        ...(ex.data || {}),
                        pageBlock
                    }
                );
            }
        },
        async resolvePageBlocks(this: PageBuilderContextObject, page: Page) {
            const blocks = [];

            for (const pageBlock of page.content?.elements) {
                const blockId = pageBlock.data?.blockId;
                // If block has blockId, then it is reference block and we need to get elements for it
                if (blockId) {
                    const blockData = await storageOperations.pageBlocks.get({
                        where: {
                            tenant: getTenantId(),
                            locale: getLocaleCode(),
                            id: blockId
                        }
                    });
                    // We check if block has variable values set on the page and use them in priority over ones,
                    // that are set in blockEditor
                    const blockDataVariables = blockData?.content?.data?.variables || [];
                    const variables = blockDataVariables.map((blockDataVariable: any) => {
                        const value =
                            pageBlock.data?.variables?.find(
                                (variable: any) => variable.id === blockDataVariable.id
                            )?.value || blockDataVariable.value;

                        return {
                            ...blockDataVariable,
                            value
                        };
                    });

                    blocks.push({
                        ...pageBlock,
                        data: {
                            blockId,
                            ...blockData?.content?.data,
                            variables
                        },
                        elements: blockData?.content?.elements || []
                    });
                } else {
                    blocks.push(pageBlock);
                }
            }

            return blocks;
        }
    };
};
