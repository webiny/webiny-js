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
    PbPageElement,
    Page,
    PageContentWithTemplate
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import { mdbid } from "@webiny/utils";
import { PageTemplatesPermissions } from "~/graphql/crud/permissions/PageTemplatesPermissions";

const createSchema = zod.object({
    title: zod.string().max(100),
    slug: zod.string().max(100),
    tags: zod.string().array(),
    description: zod.string().max(100),
    layout: zod.string().max(100).optional(),
    pageCategory: zod.string().max(100),
    content: zod.any(),
    dynamicSource: zod
        .object({
            modelId: zod.string().max(100),
            entryId: zod.string().max(100).optional()
        })
        .optional()
});

const updateSchema = zod.object({
    title: zod.string().max(100).optional(),
    slug: zod.string().max(100).optional(),
    tags: zod.string().array().optional(),
    description: zod.string().max(100).optional(),
    layout: zod.string().max(100).optional(),
    pageCategory: zod.string().max(100).optional(),
    content: zod.any(),
    dynamicSource: zod
        .object({
            modelId: zod.string().max(100),
            entryId: zod.string().max(100).optional()
        })
        .optional()
});

const getDefaultContent = () => {
    return {
        id: uniqid.time(),
        type: "document",
        data: {
            template: {
                variables: []
            }
        },
        elements: []
    };
};

export interface CreatePageTemplatesCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    pageTemplatesPermissions: PageTemplatesPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createPageTemplatesCrud = (
    params: CreatePageTemplatesCrudParams
): PageTemplatesCrud => {
    const { context, storageOperations, pageTemplatesPermissions, getLocaleCode, getTenantId } =
        params;

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

        async getPageTemplate({ where }, options = { auth: true }) {
            const { auth } = options;

            const params = {
                where: {
                    ...where,
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                }
            };

            if (auth) {
                await pageTemplatesPermissions.ensure({ rwd: "r" });
            }

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

            if (auth) {
                await pageTemplatesPermissions.ensure({ owns: pageTemplate.createdBy });
            }

            return pageTemplate;
        },

        async listPageTemplates(this: PageBuilderContextObject, params) {
            await pageTemplatesPermissions.ensure({ rwd: "r" });

            const { sort } = params || {};

            const listParams: PageTemplateStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_DESC"]
            };

            // If user can only manage own records, let's add that to the listing.
            if (await pageTemplatesPermissions.canAccessOnlyOwnRecords()) {
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
            await pageTemplatesPermissions.ensure({ rwd: "w" });

            let pageTemplateExists = true;
            try {
                await this.getPageTemplate({
                    where: { slug: input.slug }
                });
            } catch {
                pageTemplateExists = false;
            }

            if (pageTemplateExists) {
                throw new NotFoundError(`Page Template with slug "${input.slug}" already exists.`);
            }

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
            await pageTemplatesPermissions.ensure({ rwd: "w" });

            const original = await this.getPageTemplate({ where: { id } });
            if (!original) {
                throw new NotFoundError(`Page template "${id}" not found.`);
            }

            await pageTemplatesPermissions.ensure({ owns: original.createdBy });

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
            await pageTemplatesPermissions.ensure({ rwd: "d" });

            const pageTemplate = await this.getPageTemplate({ where: { id } });
            if (!pageTemplate) {
                throw new NotFoundError(`Page template "${id}" not found.`);
            }

            await pageTemplatesPermissions.ensure({ owns: pageTemplate.createdBy });

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
        async createTemplateFromPage(pageId, data) {
            const page = await context.pageBuilder.getPage(pageId);
            if (!page) {
                throw new NotFoundError(`Page "${pageId}" was not found!`);
            }

            // Here we gather template variables by going through all the blocks in the page and propagating
            // their variables to "template level" variables (`content.data.template.variables`). Note that
            // blocks are always located in page content's root. That's why we're not recursively iterating
            // through all the page content elements.
            const templateVariables: Array<{ blockId: string; variables?: PageBlockVariable[] }> =
                [];

            const templateElements = page.content?.elements?.map((block: PbPageElement) => {
                templateVariables.push({
                    blockId: block.id,
                    variables: block.data.variables
                });

                return {
                    ...block,
                    data: {
                        ...block.data,
                        templateBlockId: block.id
                    }
                };
            });

            const template = await this.createPageTemplate({
                title: data.title,
                slug: data.slug,
                description: data.description,
                tags: page.settings.general?.tags || [],
                layout: page.settings.general?.layout || "static",
                pageCategory: page.category,
                content: {
                    ...page.content,
                    data: {
                        ...(page.content?.data || {}),
                        template: {
                            variables: templateVariables
                        }
                    },
                    elements: templateElements
                }
            });

            return template;
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
