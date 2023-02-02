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
    OnAfterPageTemplateCreateTopicParams,
    OnAfterPageTemplateDeleteTopicParams,
    OnAfterPageTemplateUpdateTopicParams,
    OnBeforePageTemplateCreateTopicParams,
    OnBeforePageTemplateDeleteTopicParams,
    OnBeforePageTemplateUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageTemplate,
    PageTemplatesCrud,
    PageTemplateStorageOperationsListParams,
    PbContext
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";

const CreateDataModel = withFields({
    title: string({ validation: validation.create("required,maxLength:100") }),
    description: string({ validation: validation.create("maxLength:100") }),
    content: object()
})();

const UpdateDataModel = withFields({
    title: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:100") }),
    content: object()
})();

const PERMISSION_NAME = "pb.template";

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

    const onBeforePageTemplateCreate = createTopic<OnBeforePageTemplateCreateTopicParams>();
    const onAfterPageTemplateCreate = createTopic<OnAfterPageTemplateCreateTopicParams>();
    const onBeforePageTemplateUpdate = createTopic<OnBeforePageTemplateUpdateTopicParams>();
    const onAfterPageTemplateUpdate = createTopic<OnAfterPageTemplateUpdateTopicParams>();
    const onBeforePageTemplateDelete = createTopic<OnBeforePageTemplateDeleteTopicParams>();
    const onAfterPageTemplateDelete = createTopic<OnAfterPageTemplateDeleteTopicParams>();

    return {
        /**
         * Lifecycle events
         */
        onBeforePageTemplateCreate,
        onAfterPageTemplateCreate,
        onBeforePageTemplateUpdate,
        onAfterPageTemplateUpdate,
        onBeforePageTemplateDelete,
        onAfterPageTemplateDelete,

        async getPageTemplate(id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            if (id === "") {
                throw new WebinyError(
                    "Could not load page template by empty id.",
                    "GET_PAGE_TEMPLATE_ERROR"
                );
            }

            const params = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    id
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

        async createPageTemplate(this: PageBuilderContextObject, input) {
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const id: string = mdbid();
            const identity = context.security.getIdentity();

            const data: PageTemplate = await createDataModel.toJSON();

            const pageTemplate: PageTemplate = {
                ...data,
                tenant: getTenantId(),
                locale: getLocaleCode(),
                id,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                }
            };

            try {
                await onBeforePageTemplateCreate.publish({
                    pageTemplate
                });
                const result = await storageOperations.pageTemplates.create({
                    input: data,
                    pageTemplate
                });
                await onAfterPageTemplateCreate.publish({
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
            const original = await this.getPageTemplate(id);
            if (!original) {
                throw new NotFoundError(`Page template "${id}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            const data = await updateDataModel.toJSON({ onlyDirty: true });

            const pageTemplate: PageTemplate = {
                ...original,
                ...data,
                savedOn: new Date().toISOString()
            };

            try {
                await onBeforePageTemplateUpdate.publish({
                    original,
                    pageTemplate
                });
                const result = await storageOperations.pageTemplates.update({
                    input: data,
                    original,
                    pageTemplate
                });
                await onAfterPageTemplateUpdate.publish({
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

        async deletePageTemplate(this: PageBuilderContextObject, slug) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const pageTemplate = await this.getPageTemplate(slug);
            if (!pageTemplate) {
                throw new NotFoundError(`Page template "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageTemplate);

            try {
                await onBeforePageTemplateDelete.publish({
                    pageTemplate
                });
                const result = await storageOperations.pageTemplates.delete({
                    pageTemplate
                });
                await onAfterPageTemplateDelete.publish({
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

        async resolvePageTemplate(
            this: PageBuilderContextObject,
            content: Record<string, any> | null
        ) {
            const templateId = content?.data?.templateId;

            const templateData = await storageOperations.pageTemplates.get({
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    id: templateId
                }
            });

            const templateVariablesData = templateData?.content?.data?.templateVariables || [];
            const pageVariablesData = content?.data?.templateVariables || [];
            const blocks = [];

            for (const pageBlock of templateData?.content?.elements) {
                const blockVariablesFromTemplate =
                    templateVariablesData.find(
                        (templateVariables: Record<string, any> | null) =>
                            templateVariables?.blockId === pageBlock.data?.templateBlockId
                    )?.variables || [];

                const blockVariablesFromPage =
                    pageVariablesData.find(
                        (templateVariables: Record<string, any> | null) =>
                            templateVariables?.blockId === pageBlock.data?.templateBlockId
                    )?.variables || [];

                // If block is linked, then we take variables set on page
                // Else we take variables set in templates editor, but values for them from page
                if (pageBlock.data?.blockId) {
                    blocks.push({
                        ...pageBlock,
                        data: { ...pageBlock.data, variables: blockVariablesFromPage }
                    });
                } else {
                    const variables = [];

                    for (const templateVariable of blockVariablesFromTemplate) {
                        const valueFromPage = blockVariablesFromPage.find(
                            (variableFromPage: Record<string, any> | null) =>
                                variableFromPage?.id === templateVariable.id
                        )?.value;

                        variables.push({
                            ...templateVariable,
                            value: valueFromPage || templateVariable.value
                        });
                    }

                    blocks.push({
                        ...pageBlock,
                        data: { ...pageBlock.data, variables }
                    });
                }
            }

            return await context.pageBuilder.resolvePageBlocks({ ...content, elements: blocks });
        }
    };
};
