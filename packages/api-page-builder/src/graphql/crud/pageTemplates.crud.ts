/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import zod from "zod";
import uniqid from "uniqid";

import {
    OnPageTemplateAfterCreateTopicParams,
    OnPageTemplateAfterDeleteTopicParams,
    OnPageTemplateAfterUpdateTopicParams,
    OnPageTemplateBeforeCreateTopicParams,
    OnPageTemplateBeforeDeleteTopicParams,
    OnPageTemplateBeforeUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageTemplate,
    PageTemplateInput,
    PageTemplatesCrud,
    PageTemplateStorageOperationsListParams,
    PageBlockVariable,
    PbContext,
    Page,
    PageContentWithTemplate
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

const createSchema = zod.object({
    title: zod.string().max(100),
    slug: zod.string().max(100),
    tags: zod.string().array(),
    description: zod.string().max(100),
    layout: zod.string().max(100).optional(),
    pageCategory: zod.string().max(100),
    content: zod.any()
});

const updateSchema = zod.object({
    title: zod.string().max(100).optional(),
    slug: zod.string().max(100).optional(),
    tags: zod.string().array().optional(),
    description: zod.string().max(100).optional(),
    layout: zod.string().max(100).optional(),
    pageCategory: zod.string().max(100).optional(),
    content: zod.any()
});

const PERMISSION_NAME = "pb.template";

const getDefaultContent = () => {
    return {
        id: uniqid.time(),
        type: "document",
        data: {},
        elements: []
    };
};

export interface CreatePageTemplatesCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}
export const createPageTemplatesCrud = (
    params: CreatePageTemplatesCrudParams
): PageTemplatesCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

    const onPageTemplateBeforeCreate = createTopic<OnPageTemplateBeforeCreateTopicParams>();
    const onPageTemplateAfterCreate = createTopic<OnPageTemplateAfterCreateTopicParams>();
    const onPageTemplateBeforeUpdate = createTopic<OnPageTemplateBeforeUpdateTopicParams>();
    const onPageTemplateAfterUpdate = createTopic<OnPageTemplateAfterUpdateTopicParams>();
    const onPageTemplateBeforeDelete = createTopic<OnPageTemplateBeforeDeleteTopicParams>();
    const onPageTemplateAfterDelete = createTopic<OnPageTemplateAfterDeleteTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onPageTemplateBeforeCreate,
        onPageTemplateAfterCreate,
        onPageTemplateBeforeUpdate,
        onPageTemplateAfterUpdate,
        onPageTemplateBeforeDelete,
        onPageTemplateAfterDelete,

        async getPageTemplate({ where }) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const params = {
                where: {
                    ...where,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            };

            let pageTemplate: PageTemplate | null = null;
            try {
                pageTemplate = await storageOperations.pageTemplates.get(params);
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get page template by id.",
                    ex.code || "GET_PAGE_TEMPLATE_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }

            if (!pageTemplate) {
                throw new NotFoundError(`Page template not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageTemplate);

            return pageTemplate;
        },

        async listPageTemplates(this: PageBuilderContextObject, params) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const { sort } = params || {};

            const listParams: PageTemplateStorageOperationsListParams = {
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
                const [items] = await storageOperations.pageTemplates.list(listParams);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list all page templates.",
                    ex.code || "LIST_PAGE_TEMPLATES_ERROR",
                    {
                        params
                    }
                );
            }
        },

        async createPageTemplate(this: PageBuilderContextObject, input: PageTemplateInput) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const identity = context.security.getIdentity();

            const data = await createSchema.parseAsync(input);

            const pageTemplate: PageTemplate = {
                ...data,
                content: data.content || getDefaultContent(),
                tenant: getTenantId(),
                locale: getLocaleCode(),
                id: input.id || mdbid(),
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                }
            };

            try {
                await onPageTemplateBeforeCreate.publish({
                    pageTemplate
                });
                const result = await storageOperations.pageTemplates.create({
                    input: data,
                    pageTemplate
                });
                await onPageTemplateAfterCreate.publish({
                    pageTemplate
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create page template.",
                    ex.code || "CREATE_PAGE_TEMPLATE_ERROR",
                    {
                        ...(ex.data || {}),
                        pageTemplate
                    }
                );
            }
        },

        async updatePageTemplate(this: PageBuilderContextObject, id, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await this.getPageTemplate({ where: { id } });
            if (!original) {
                throw new NotFoundError(`Page template "${id}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const data = await updateSchema.parseAsync(input);

            const pageTemplate: PageTemplate = {
                ...original,
                ...data,
                savedOn: new Date().toISOString()
            };

            try {
                await onPageTemplateBeforeUpdate.publish({
                    original,
                    pageTemplate
                });
                const result = await storageOperations.pageTemplates.update({
                    input: data,
                    original,
                    pageTemplate
                });
                await onPageTemplateAfterUpdate.publish({
                    original,
                    pageTemplate: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update page template.",
                    ex.code || "UPDATE_PAGE_TEMPLATE_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        pageTemplate
                    }
                );
            }
        },

        async deletePageTemplate(this: PageBuilderContextObject, id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const pageTemplate = await this.getPageTemplate({ where: { id } });
            if (!pageTemplate) {
                throw new NotFoundError(`Page template "${id}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageTemplate);

            try {
                await onPageTemplateBeforeDelete.publish({
                    pageTemplate
                });
                const result = await storageOperations.pageTemplates.delete({
                    pageTemplate
                });
                await onPageTemplateAfterDelete.publish({
                    pageTemplate: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete page template.",
                    ex.code || "DELETE_PAGE_TEMPLATE_ERROR",
                    {
                        ...(ex.data || {}),
                        pageTemplate
                    }
                );
            }
        },

        async resolvePageTemplate(this: PageBuilderContextObject, content) {
            const { slug } = content.data.template;
            const blocks = [];

            const template = await storageOperations.pageTemplates.get({
                where: {
                    slug,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            });

            if (template) {
                // Take blocks from template, and assign the appropriate variable values to them.
                const templateContent = template.content as PageContentWithTemplate;
                const templateBlocks = templateContent.elements || [];

                // Template-level variables.
                const templateVars = templateContent.data.template.variables || [];

                // Page-level variables.
                const pageVars = content.data.template.variables || [];

                for (const pageBlock of templateBlocks) {
                    // Find page-level variables for current page block.
                    const pageBlockVars =
                        pageVars.find(pageVar => {
                            return pageVar.blockId === pageBlock.data?.templateBlockId;
                        })?.variables || [];

                    // If block is linked, then we use variables set on the page itself.
                    if (pageBlock.data?.blockId) {
                        blocks.push({
                            ...pageBlock,
                            data: { ...pageBlock.data, variables: pageBlockVars }
                        });

                        continue;
                    }

                    // Otherwise, we use variable definitions set on the template, but assign values set on the page.
                    const variables = [];

                    // Find template-level variables for current page block.
                    const templateBlockVars: PageBlockVariable[] =
                        templateVars.find(templateVar => {
                            return templateVar.blockId === pageBlock.data?.templateBlockId;
                        })?.variables || [];

                    for (const templateVariable of templateBlockVars) {
                        const { value } =
                            pageBlockVars.find(
                                pageVariable => pageVariable.id === templateVariable.id
                            ) || {};

                        variables.push({
                            ...templateVariable,
                            value: value || templateVariable.value
                        });
                    }

                    blocks.push({
                        ...pageBlock,
                        data: { ...pageBlock.data, variables }
                    });
                }
            }

            return await context.pageBuilder.resolvePageBlocks({ ...content, elements: blocks });
        },
        async createPageFromTemplate({ id, slug, path, meta }) {
            const template = await this.getPageTemplate({ where: { id, slug } });
            if (!template) {
                throw new NotFoundError(`Page template "${id || slug}" was not found!`);
            }
            const page = await context.pageBuilder.createPage(template.pageCategory, meta);
            this.copyTemplateDataToPage(template, page);

            await context.pageBuilder.updatePage(page.id, {
                content: page.content,
                settings: page.settings,
                path: path || page.path
            });

            return page;
        },
        copyTemplateDataToPage(template: PageTemplate, page: Page) {
            const content = {
                ...template.content,
                data: {
                    ...template.content.data,
                    template: {
                        ...template.content.data.template,
                        slug: template.slug
                    }
                },
                elements: []
            };

            const settings = {
                general: {
                    ...page.settings.general,
                    layout: template.layout
                }
            };

            Object.assign(page, { content, settings });
        }
    };
};
