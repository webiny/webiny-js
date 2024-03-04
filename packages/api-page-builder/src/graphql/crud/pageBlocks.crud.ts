import WebinyError from "@webiny/error";
import {
    OnPageBlockAfterCreateTopicParams,
    OnPageBlockAfterDeleteTopicParams,
    OnPageBlockAfterUpdateTopicParams,
    OnPageBlockBeforeCreateTopicParams,
    OnPageBlockBeforeDeleteTopicParams,
    OnPageBlockBeforeUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageBlock,
    PageBlocksCrud,
    PageBlockStorageOperationsListParams,
    PbContext,
    PageContentElement
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import { createTopic } from "@webiny/pubsub";
import {
    createPageBlocksCreateValidation,
    createPageBlocksUpdateValidation
} from "~/graphql/crud/pageBlocks/validation";
import { createZodError, mdbid, removeUndefinedValues } from "@webiny/utils";
import { PageBlocksPermissions } from "./permissions/PageBlocksPermissions";

export interface CreatePageBlocksCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    pageBlocksPermissions: PageBlocksPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createPageBlocksCrud = (params: CreatePageBlocksCrudParams): PageBlocksCrud => {
    const { context, storageOperations, pageBlocksPermissions, getLocaleCode, getTenantId } =
        params;

    const onPageBlockBeforeCreate = createTopic<OnPageBlockBeforeCreateTopicParams>();
    const onPageBlockAfterCreate = createTopic<OnPageBlockAfterCreateTopicParams>();
    const onPageBlockBeforeUpdate = createTopic<OnPageBlockBeforeUpdateTopicParams>();
    const onPageBlockAfterUpdate = createTopic<OnPageBlockAfterUpdateTopicParams>();
    const onPageBlockBeforeDelete = createTopic<OnPageBlockBeforeDeleteTopicParams>();
    const onPageBlockAfterDelete = createTopic<OnPageBlockAfterDeleteTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onPageBlockBeforeCreate,
        onPageBlockAfterCreate,
        onPageBlockBeforeUpdate,
        onPageBlockAfterUpdate,
        onPageBlockBeforeDelete,
        onPageBlockAfterDelete,

        async getPageBlock(id) {
            await pageBlocksPermissions.ensure({ rwd: "r" });

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

            await pageBlocksPermissions.ensure({ owns: pageBlock.createdBy });

            return pageBlock;
        },

        async listPageBlocks(this: PageBuilderContextObject, params) {
            await pageBlocksPermissions.ensure({ rwd: "r" });

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
            if (await pageBlocksPermissions.canAccessOnlyOwnRecords()) {
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
            await pageBlocksPermissions.ensure({ rwd: "w" });

            const validationResult = await createPageBlocksCreateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const data = validationResult.data;

            const blockCategory = await this.getBlockCategory(data.blockCategory);
            if (!blockCategory) {
                throw new NotFoundError(`Block category not found!`);
            }

            const id: string = mdbid();
            const identity = context.security.getIdentity();

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
                await onPageBlockBeforeCreate.publish({
                    pageBlock
                });
                const result = await storageOperations.pageBlocks.create({
                    input: data,
                    pageBlock
                });
                await onPageBlockAfterCreate.publish({
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
            await pageBlocksPermissions.ensure({ rwd: "w" });

            const original = await this.getPageBlock(id);
            if (!original) {
                throw new NotFoundError(`Page block "${id}" not found.`);
            }

            await pageBlocksPermissions.ensure({ owns: original.createdBy });

            const validationResult = await createPageBlocksUpdateValidation().safeParseAsync(input);
            if (!validationResult.success) {
                throw createZodError(validationResult.error);
            }

            const data = removeUndefinedValues(validationResult.data);

            if (data.blockCategory) {
                const blockCategory = await this.getBlockCategory(data.blockCategory);
                if (!blockCategory) {
                    throw new NotFoundError(`Requested page block category doesn't exist.`);
                }
            }

            const pageBlock: PageBlock = {
                ...original,
                ...data
            };

            try {
                await onPageBlockBeforeUpdate.publish({
                    original,
                    pageBlock
                });
                const result = await storageOperations.pageBlocks.update({
                    input: data,
                    original,
                    pageBlock
                });
                await onPageBlockAfterUpdate.publish({
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
            await pageBlocksPermissions.ensure({ rwd: "d" });

            const pageBlock = await this.getPageBlock(slug);
            if (!pageBlock) {
                throw new NotFoundError(`Page block "${slug}" not found.`);
            }

            await pageBlocksPermissions.ensure({ owns: pageBlock.createdBy });

            try {
                await onPageBlockBeforeDelete.publish({
                    pageBlock
                });

                await storageOperations.pageBlocks.delete({
                    pageBlock
                });

                await onPageBlockAfterDelete.publish({
                    pageBlock
                });

                return true;
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
        async resolvePageBlocks(
            this: PageBuilderContextObject,
            content: Record<string, any> | null
        ) {
            const blocks = [];

            for (const pageBlock of content?.elements) {
                const blockId = pageBlock.data?.blockId;
                // If block has blockId, then it is a reference block, and we need to get elements for it.
                if (!blockId) {
                    blocks.push(pageBlock);
                    continue;
                }

                const blockData = await storageOperations.pageBlocks.get({
                    where: {
                        tenant: getTenantId(),
                        locale: getLocaleCode(),
                        id: blockId
                    }
                });

                // We check if the block has variable values set on the page/template, and use them
                // in priority over the ones set inline in the block editor.
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

                blocks.push(
                    structuredClone({
                        ...pageBlock,
                        data: {
                            ...pageBlock?.data,
                            ...blockData?.content?.data,
                            variables
                        },
                        elements: generateElementIds(
                            blockData?.content?.elements || [],
                            pageBlock.id
                        )
                    })
                );
            }

            return blocks;
        }
    };
};

function generateElementIds(elements: PageContentElement[], id: string): PageContentElement[] {
    return elements.map(element => {
        return {
            ...element,
            id: `${id}.${element.id}`,
            elements: generateElementIds(element.elements, id)
        };
    });
}
