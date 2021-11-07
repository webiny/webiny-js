import { withFields, string } from "@commodo/fields";
import { validation } from "@webiny/validation";
import mdbid from "mdbid";
import {
    CmsContentModelGroupContext,
    CmsContentModelGroupListArgs,
    CmsContentModelGroupPermission,
    CmsContentModelGroup,
    CmsContext,
    HeadlessCmsStorageOperations,
    CmsContentModelGroupCreateInput,
    BeforeGroupCreateTopic,
    AfterGroupCreateTopic,
    BeforeGroupUpdateTopic,
    AfterGroupUpdateTopic,
    BeforeGroupDeleteTopic,
    AfterGroupDeleteTopic
} from "~/types";
import * as utils from "../../../utils";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeUpdate } from "~/content/plugins/crud/contentModelGroup/beforeUpdate";
import { assignBeforeCreate } from "~/content/plugins/crud/contentModelGroup/beforeCreate";
import { assignBeforeDelete } from "~/content/plugins/crud/contentModelGroup/beforeDelete";

const CreateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("required,maxLength:100") }),
    slug: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("required,maxLength:255") })
})();

const UpdateContentModelGroupModel = withFields({
    name: string({ validation: validation.create("maxLength:100") }),
    description: string({ validation: validation.create("maxLength:255") }),
    icon: string({ validation: validation.create("maxLength:255") })
})();

export interface Params {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}
export const createModelGroupsCrud = (params: Params): CmsContentModelGroupContext => {
    const { getTenant, getIdentity, getLocale, storageOperations, context } = params;

    const checkPermissions = (check: string): Promise<CmsContentModelGroupPermission> => {
        return utils.checkPermissions(context, "cms.contentModelGroup", { rwd: check });
    };

    const groupsGet = async (id: string) => {
        const groupPlugin: ContentModelGroupPlugin = context.plugins
            .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
            .find((item: ContentModelGroupPlugin) => item.contentModelGroup.id === id);

        if (groupPlugin) {
            return groupPlugin.contentModelGroup;
        }

        let group: CmsContentModelGroup | null = null;
        try {
            group = await storageOperations.groups.get({
                tenant: getTenant().id,
                locale: getLocale().code,
                id
            });
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code || "GET_ERROR", {
                ...(ex.data || {}),
                id
            });
        }
        if (!group) {
            throw new NotFoundError(`Content model group "${id}" was not found!`);
        }

        return group;
    };

    const groupsList = async (args: CmsContentModelGroupListArgs) => {
        const { where } = args;
        try {
            const pluginsGroups: CmsContentModelGroup[] = context.plugins
                .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
                .map<CmsContentModelGroup>(plugin => plugin.contentModelGroup);

            const databaseGroups = await storageOperations.groups.list({ where });

            return [...databaseGroups, ...pluginsGroups];
        } catch (ex) {
            throw new WebinyError(ex.message, ex.code || "LIST_ERROR", {
                ...(ex.data || {}),
                where
            });
        }
    };

    const onBeforeCreate = createTopic<BeforeGroupCreateTopic>();
    const onAfterCreate = createTopic<AfterGroupCreateTopic>();
    const onBeforeUpdate = createTopic<BeforeGroupUpdateTopic>();
    const onAfterUpdate = createTopic<AfterGroupUpdateTopic>();
    const onBeforeDelete = createTopic<BeforeGroupDeleteTopic>();
    const onAfterDelete = createTopic<AfterGroupDeleteTopic>();

    /**
     * We need to assign some initial events on our topics.
     * - before create
     * - before update
     * - before delete
     */
    assignBeforeCreate({
        onBeforeCreate,
        plugins: context.plugins,
        storageOperations
    });
    assignBeforeUpdate({
        onBeforeUpdate,
        plugins: context.plugins
    });
    assignBeforeDelete({
        onBeforeDelete,
        plugins: context.plugins,
        storageOperations
    });

    return {
        onBeforeCreate,
        onAfterCreate,
        onBeforeUpdate,
        onAfterUpdate,
        onBeforeDelete,
        onAfterDelete,
        operations: storageOperations.groups,
        noAuth: () => {
            return {
                get: groupsGet,
                list: groupsList
            };
        },
        get: async id => {
            const permission = await checkPermissions("r");

            const group = await groupsGet(id);
            utils.checkOwnership(context, permission, group);
            utils.validateGroupAccess(context, permission, group);

            return group;
        },
        list: async params => {
            const permission = await checkPermissions("r");

            const response = await groupsList(params);

            return response.filter(group => {
                if (!utils.validateOwnership(context, permission, group)) {
                    return false;
                }
                return utils.validateGroupAccess(context, permission, group);
            });
        },
        create: async inputData => {
            await checkPermissions("w");

            const createdData = new CreateContentModelGroupModel().populate({
                ...inputData,
                slug: inputData.slug ? utils.toSlug(inputData.slug) : ""
            });
            await createdData.validate();
            const input: CmsContentModelGroupCreateInput & { slug: string } =
                await createdData.toJSON();

            const identity = getIdentity();

            const id = mdbid();
            const group: CmsContentModelGroup = {
                ...input,
                id,
                tenant: getTenant().id,
                locale: getLocale().code,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                webinyVersion: context.WEBINY_VERSION
            };
            try {
                await onBeforeCreate.publish({
                    group
                });

                const result = await storageOperations.groups.create({
                    input,
                    group
                });

                await onAfterCreate.publish({
                    group: result
                });

                return group;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not save data model group.",
                    ex.code || "ERROR_ON_CREATE",
                    {
                        ...(ex.data || {}),
                        group,
                        input
                    }
                );
            }
        },
        update: async (id, inputData) => {
            const permission = await checkPermissions("w");

            const original = await groupsGet(id);

            utils.checkOwnership(context, permission, original);

            const input = new UpdateContentModelGroupModel().populate(inputData);
            await input.validate();

            const updatedDataJson: Partial<CmsContentModelGroup> = await input.toJSON({
                onlyDirty: true
            });

            /**
             * No need to continue if no values were changed
             */
            if (Object.keys(updatedDataJson).length === 0) {
                return original;
            }

            const group: CmsContentModelGroup = {
                ...original,
                ...updatedDataJson,
                tenant: getTenant().id,
                savedOn: new Date().toISOString()
            };

            try {
                await onBeforeUpdate.publish({
                    original,
                    group
                });

                const updatedGroup = await storageOperations.groups.update({
                    original,
                    group,
                    input
                });

                await onAfterUpdate.publish({
                    original,
                    group: updatedGroup
                });

                return updatedGroup;
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code || "UPDATE_ERROR", {
                    error: ex,
                    original,
                    group,
                    input
                });
            }
        },
        delete: async id => {
            const permission = await checkPermissions("d");

            const group = await groupsGet(id);

            utils.checkOwnership(context, permission, group);

            try {
                await onBeforeDelete.publish({
                    group
                });

                await storageOperations.groups.delete({ group });

                await onAfterDelete.publish({
                    group
                });
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code || "DELETE_ERROR", {
                    ...(ex.data || {}),
                    id
                });
            }

            return true;
        }
    };
};
