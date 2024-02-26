import {
    OnPageElementAfterCreateTopicParams,
    OnPageElementAfterDeleteTopicParams,
    OnPageElementAfterUpdateTopicParams,
    OnPageElementBeforeCreateTopicParams,
    OnPageElementBeforeDeleteTopicParams,
    OnPageElementBeforeUpdateTopicParams,
    PageBuilderContextObject,
    PageBuilderStorageOperations,
    PageElement,
    PageElementsCrud,
    PageElementStorageOperationsListParams,
    PbContext
} from "~/types";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import {
    createPageElementsCreateValidation,
    createPageElementsUpdateValidation
} from "~/graphql/crud/pageElements/validation";
import { createZodError, mdbid, removeUndefinedValues } from "@webiny/utils";
import { PagesPermissions } from "~/graphql/crud/permissions/PagesPermissions";

export interface CreatePageElementsCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    pagesPermissions: PagesPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createPageElementsCrud = (params: CreatePageElementsCrudParams): PageElementsCrud => {
    const { context, storageOperations, pagesPermissions, getLocaleCode, getTenantId } = params;

    // create
    const onPageElementBeforeCreate = createTopic<OnPageElementBeforeCreateTopicParams>(
        "pageBuilder.onPageElementBeforeCreate"
    );
    const onPageElementAfterCreate = createTopic<OnPageElementAfterCreateTopicParams>(
        "pageBuilder.onPageElementAfterCreate"
    );
    // update
    const onPageElementBeforeUpdate = createTopic<OnPageElementBeforeUpdateTopicParams>(
        "pageBuilder.onPageElementBeforeUpdate"
    );
    const onPageElementAfterUpdate = createTopic<OnPageElementAfterUpdateTopicParams>(
        "pageBuilder.onPageElementAfterUpdate"
    );
    // delete
    const onPageElementBeforeDelete = createTopic<OnPageElementBeforeDeleteTopicParams>(
        "pageBuilder.onPageElementBeforeDelete"
    );
    const onPageElementAfterDelete = createTopic<OnPageElementAfterDeleteTopicParams>(
        "pageBuilder.onPageElementAfterDelete"
    );

    return {
        /**
         * Introduced in 5.34.0
         */
        onPageElementBeforeCreate,
        onPageElementAfterCreate,
        onPageElementBeforeUpdate,
        onPageElementAfterUpdate,
        onPageElementBeforeDelete,
        onPageElementAfterDelete,
        async getPageElement(id) {
            await pagesPermissions.ensure({ rwd: "r" });

            const params = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode(),
                    id
                }
            };

            let pageElement: PageElement | null = null;
            try {
                pageElement = await storageOperations.pageElements.get(params);
                if (!pageElement) {
                    return null;
                }
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not get pageElement by slug.",
                    ex.code || "GET_PAGE_ELEMENT_ERROR",
                    {
                        ...(ex.data || {}),
                        params
                    }
                );
            }

            await pagesPermissions.ensure({ owns: pageElement.createdBy });

            return pageElement;
        },

        async listPageElements(params) {
            await pagesPermissions.ensure({ rwd: "r" });

            const { sort } = params || {};

            const listParams: PageElementStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                limit: 1000,
                sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_ASC"]
            };

            // If user can only manage own records, let's add that to the listing.
            if (await pagesPermissions.canAccessOnlyOwnRecords()) {
                const identity = context.security.getIdentity();
                listParams.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.pageElements.list(listParams);
                return items;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not list all page elements.",
                    ex.code || "LIST_PAGE_ELEMENTS_ERROR",
                    {
                        params
                    }
                );
            }
        },

        async createPageElement(input) {
            await pagesPermissions.ensure({ rwd: "w" });

            const validation = await createPageElementsCreateValidation().safeParseAsync(input);
            if (!validation.success) {
                throw createZodError(validation.error);
            }

            const id: string = mdbid();
            const identity = context.security.getIdentity();

            const pageElement: PageElement = {
                ...validation.data,
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
                await onPageElementBeforeCreate.publish({
                    pageElement
                });
                const result = await storageOperations.pageElements.create({
                    input: validation.data,
                    pageElement
                });
                await onPageElementAfterCreate.publish({
                    pageElement
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not create page element.",
                    ex.code || "CREATE_PAGE_ELEMENT_ERROR",
                    {
                        ...(ex.data || {}),
                        pageElement
                    }
                );
            }
        },

        async updatePageElement(this: PageBuilderContextObject, id, input) {
            await pagesPermissions.ensure({ rwd: "w" });

            const original = await this.getPageElement(id);
            if (!original) {
                throw new NotFoundError(`Page element "${id}" not found.`);
            }

            await pagesPermissions.ensure({ owns: original.createdBy });

            const validation = await createPageElementsUpdateValidation().safeParseAsync(input);
            if (!validation.success) {
                throw createZodError(validation.error);
            }

            const data = removeUndefinedValues(validation.data);

            const pageElement: PageElement = {
                ...original,
                ...data
            };

            try {
                await onPageElementBeforeUpdate.publish({
                    original,
                    pageElement
                });
                const result = await storageOperations.pageElements.update({
                    input: data,
                    original,
                    pageElement
                });
                await onPageElementAfterUpdate.publish({
                    original,
                    pageElement: result
                });
                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not update page element.",
                    ex.code || "UPDATE_PAGE_ELEMENT_ERROR",
                    {
                        ...(ex.data || {}),
                        original,
                        pageElement
                    }
                );
            }
        },

        async deletePageElement(this: PageBuilderContextObject, slug) {
            await pagesPermissions.ensure({ rwd: "d" });

            const pageElement = await this.getPageElement(slug);
            if (!pageElement) {
                throw new NotFoundError(`PageElement "${slug}" not found.`);
            }

            await pagesPermissions.ensure({ owns: pageElement.createdBy });

            try {
                await onPageElementBeforeDelete.publish({
                    pageElement
                });

                await storageOperations.pageElements.delete({
                    pageElement
                });

                await onPageElementAfterDelete.publish({
                    pageElement
                });
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not delete page element.",
                    ex.code || "DELETE_PAGE_ELEMENT_ERROR",
                    {
                        ...(ex.data || {}),
                        pageElement
                    }
                );
            }
        }
    };
};
