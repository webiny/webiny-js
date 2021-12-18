import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import mdbid from "mdbid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import {
    OnAfterPageElementCreateTopicParams,
    OnAfterPageElementDeleteTopicParams,
    OnAfterPageElementUpdateTopicParams,
    OnBeforePageElementCreateTopicParams,
    OnBeforePageElementDeleteTopicParams,
    OnBeforePageElementUpdateTopicParams,
    PageElement,
    PageElementStorageOperations,
    PageElementStorageOperationsListParams,
    PbContext
} from "~/types";
import checkBasePermissions from "./utils/checkBasePermissions";
import checkOwnPermissions from "./utils/checkOwnPermissions";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { PageElementStorageOperationsProviderPlugin } from "~/plugins/PageElementStorageOperationsProviderPlugin";
import { createStorageOperations } from "~/graphql/crud/storageOperations";
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

export default new ContextPlugin<PbContext>(async context => {
    /**
     * If pageBuilder is not defined on the context, do not continue, but log it.
     */
    if (!context.pageBuilder) {
        console.log("Missing pageBuilder on context. Skipping Page Elements crud.");
        return;
    }

    const storageOperations = await createStorageOperations<PageElementStorageOperations>(
        context,
        PageElementStorageOperationsProviderPlugin.type
    );

    const onBeforePageElementCreate = createTopic<OnBeforePageElementCreateTopicParams>();
    const onAfterPageElementCreate = createTopic<OnAfterPageElementCreateTopicParams>();
    const onBeforePageElementUpdate = createTopic<OnBeforePageElementUpdateTopicParams>();
    const onAfterPageElementUpdate = createTopic<OnAfterPageElementUpdateTopicParams>();
    const onBeforePageElementDelete = createTopic<OnBeforePageElementDeleteTopicParams>();
    const onAfterPageElementDelete = createTopic<OnAfterPageElementDeleteTopicParams>();

    context.pageBuilder.pageElements = {
        /**
         * Lifecycle events
         */
        onBeforePageElementCreate,
        onAfterPageElementCreate,
        onBeforePageElementUpdate,
        onAfterPageElementUpdate,
        onBeforePageElementDelete,
        onAfterPageElementDelete,
        /**
         * Storage operations
         */
        storageOperations,
        async getPageElement(id) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "r"
            });

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getCurrentLocale();

            const params = {
                where: {
                    tenant: tenant.id,
                    locale: locale.code,
                    id
                }
            };

            let pageElement: PageElement | undefined;
            try {
                pageElement = await storageOperations.get(params);
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

            const tenant = context.tenancy.getCurrentTenant();
            const locale = context.i18nContent.getCurrentLocale();

            const { sort } = params || {};

            const listParams: PageElementStorageOperationsListParams = {
                where: {
                    tenant: tenant.id,
                    locale: locale.code
                },
                sort: Array.isArray(sort) && sort.length > 0 ? sort : ["createdOn_ASC"]
            };

            // If user can only manage own records, let's add that to the listing.
            if (permission.own) {
                const identity = context.security.getIdentity();
                listParams.where.createdBy = identity.id;
            }

            try {
                const [items] = await storageOperations.list(listParams);
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
                tenant: context.tenancy.getCurrentTenant().id,
                locale: context.i18nContent.getCurrentLocale().code,
                id,
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                }
            };

            try {
                return await storageOperations.create({
                    input: data,
                    pageElement
                });
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

        async updatePageElement(id, input) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            const original = await context.pageBuilder.pageElements.getPageElement(id);
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
                return await storageOperations.update({
                    input: data,
                    original,
                    pageElement
                });
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

        async deletePageElement(slug) {
            const permission = await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "d"
            });

            const pageElement = await context.pageBuilder.pageElements.getPageElement(slug);
            if (!pageElement) {
                throw new NotFoundError(`PageElement "${slug}" not found.`);
            }

            const identity = context.security.getIdentity();
            checkOwnPermissions(identity, permission, pageElement);

            try {
                return await storageOperations.delete({
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
});
