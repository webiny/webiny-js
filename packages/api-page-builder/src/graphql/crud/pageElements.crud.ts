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

const CreateDataModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    type: string({ validation: validation.create("required,in:element:block") }),
    category: string({ validation: validation.create("required,maxLength:100") }),
    content: object({ validation: validation.create("required") }),
    preview: object({ validation: validation.create("required") })
})();

const UpdateDataModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    type: string({ validation: validation.create("in:element:block") }),
    category: string({ validation: validation.create("maxLength:100") }),
    content: object(),
    preview: object()
})();

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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
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
            checkOwnPermissions(identity, permission, pageElement);

            return pageElement;
        },

        async listPageElements(params) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
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
            if (permission.own) {
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

            const createDataModel = new CreateDataModel().populate(input);
            await createDataModel.validate();

            const id: string = mdbid();
            const identity = context.security.getIdentity();

            const data: PageElement = await createDataModel.toJSON();

            const pageElement: PageElement = {
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
                await onPageElementBeforeCreate.publish({
                    pageElement
                });
                const result = await storageOperations.pageElements.create({
                    input: data,
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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await this.getPageElement(id);
            if (!original) {
                throw new NotFoundError(`Page element "${id}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, original);

            const updateDataModel = new UpdateDataModel().populate(input);
            await updateDataModel.validate();

            const data = await updateDataModel.toJSON({ onlyDirty: true });

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
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const pageElement = await this.getPageElement(slug);
            if (!pageElement) {
                throw new NotFoundError(`PageElement "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageElement);

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
