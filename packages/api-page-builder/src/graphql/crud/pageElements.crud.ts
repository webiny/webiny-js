/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
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
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import {
    createPageElementsCreateValidation,
    createPageElementsUpdateValidation
} from "~/graphql/crud/pageElements/validation";
import { createZodError, removeUndefinedValues } from "@webiny/utils";
import canAccessAllRecords from "~/graphql/crud/utils/canAccessAllRecords";

const PERMISSION_NAME = "pb.page";

export interface CreatePageElementsCrudParams {
    context: PbContext;
    storageOperations: PageBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
}

export const createPageElementsCrud = (params: CreatePageElementsCrudParams): PageElementsCrud => {
    const { context, storageOperations, getLocaleCode, getTenantId } = params;

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
         * Lifecycle events - deprecated in 5.34.0 - will be removed in 5.36.0
         */
        onBeforePageElementCreate: onPageElementBeforeCreate,
        onAfterPageElementCreate: onPageElementAfterCreate,
        onBeforePageElementUpdate: onPageElementBeforeUpdate,
        onAfterPageElementUpdate: onPageElementAfterUpdate,
        onBeforePageElementDelete: onPageElementBeforeDelete,
        onAfterPageElementDelete: onPageElementAfterDelete,
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
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

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

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, pageElement);

            return pageElement;
        },

        async listPageElements(params) {
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const { sort } = params || {};

            const listParams: PageElementStorageOperationsListParams = {
                where: {
                    tenant: getTenantId(),
                    locale: getLocaleCode()
                },
                sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_ASC"]
            };

            // If user can only manage own records, let's add that to the listing.
            if (!canAccessAllRecords(permissions)) {
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
            await checkBasePermissions(context, PERMISSION_NAME, { rwd: "w" });

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
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await this.getPageElement(id);
            if (!original) {
                throw new NotFoundError(`Page element "${id}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, original);

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
            const permissions = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const pageElement = await this.getPageElement(slug);
            if (!pageElement) {
                throw new NotFoundError(`PageElement "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permissions, pageElement);

            try {
                await onPageElementBeforeDelete.publish({
                    pageElement
                });
                const result = await storageOperations.pageElements.delete({
                    pageElement
                });
                await onPageElementAfterDelete.publish({
                    pageElement: result
                });
                return result;
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
