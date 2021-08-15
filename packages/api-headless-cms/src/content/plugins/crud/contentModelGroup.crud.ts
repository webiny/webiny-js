import { withFields, string } from "@commodo/fields";
import { ContextPlugin } from "@webiny/handler/types";
import { validation } from "@webiny/validation";
import mdbid from "mdbid";
import {
    CmsContentModelGroupContext,
    CmsContentModelGroupListArgs,
    CmsContentModelGroupPermission,
    CmsContentModelGroup,
    CmsContext,
    CmsContentModelGroupStorageOperationsProvider
} from "../../../types";
import * as utils from "../../../utils";
import { beforeDeleteHook } from "./contentModelGroup/beforeDelete.hook";
import { beforeCreateHook } from "./contentModelGroup/beforeCreate.hook";
import { afterDeleteHook } from "./contentModelGroup/afterDelete.hook";
import { NotFoundError } from "@webiny/handler-graphql";
import WebinyError from "@webiny/error";
import { afterUpdateHook } from "./contentModelGroup/afterUpdate.hook";
import { beforeUpdateHook } from "./contentModelGroup/beforeUpdate.hook";
import { afterCreateHook } from "./contentModelGroup/afterCreate.hook";
import { ContentModelGroupPlugin } from "~/content/plugins/ContentModelGroupPlugin";

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

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    async apply(context) {
        /**
         * If cms is not defined on the context, do not continue, but log it.
         */
        if (!context.cms) {
            console.log("Missing cms on context. Skipping ContentModelGroup crud.");
            return;
        }
        const pluginType = "cms-content-model-group-storage-operations-provider";
        const providerPlugins =
            context.plugins.byType<CmsContentModelGroupStorageOperationsProvider>(pluginType);
        /**
         * Storage operations operations for the content model group.
         * Contains logic to save the data into the specific storage.
         */
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if (!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }

        const storageOperations = await providerPlugin.provide({
            context
        });

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
                group = await storageOperations.get({ id });
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

        const groupsList = async (args?: CmsContentModelGroupListArgs) => {
            const { where, limit } = args || {};
            try {
                const pluginsGroups: CmsContentModelGroup[] = context.plugins
                    .byType<ContentModelGroupPlugin>(ContentModelGroupPlugin.type)
                    .map<CmsContentModelGroup>(plugin => plugin.contentModelGroup);

                const databaseGroups = await storageOperations.list({ where, limit });

                return [...databaseGroups, ...pluginsGroups];
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code || "LIST_ERROR", {
                    ...(ex.data || {}),
                    where,
                    limit
                });
            }
        };

        const groups: CmsContentModelGroupContext = {
            operations: storageOperations,
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
            list: async args => {
                const permission = await checkPermissions("r");

                const response = await groupsList(args);

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
                const input = await createdData.toJSON();

                const identity = context.security.getIdentity();

                const id = mdbid();
                const data: CmsContentModelGroup = {
                    ...input,
                    id,
                    locale: context.cms.getLocale().code,
                    createdOn: new Date().toISOString(),
                    savedOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName,
                        type: identity.type
                    }
                };
                try {
                    await beforeCreateHook({
                        context,
                        storageOperations,
                        input,
                        data
                    });
                    const group = await storageOperations.create({
                        input,
                        data
                    });
                    await afterCreateHook({
                        context,
                        storageOperations,
                        input,
                        group
                    });
                    return group;
                } catch (ex) {
                    throw new WebinyError(
                        ex.message || "Could not save data model group.",
                        ex.code || "ERROR_ON_CREATE",
                        {
                            ...(ex.data || {}),
                            data,
                            input
                        }
                    );
                }
            },
            update: async (id, inputData) => {
                const permission = await checkPermissions("w");

                const group = await groupsGet(id);

                utils.checkOwnership(context, permission, group);

                const input = new UpdateContentModelGroupModel().populate(inputData);
                await input.validate();

                const updatedDataJson = await input.toJSON({ onlyDirty: true });

                // no need to continue if no values were changed
                if (Object.keys(updatedDataJson).length === 0) {
                    return group;
                }

                const data: CmsContentModelGroup = Object.assign(updatedDataJson, {
                    savedOn: new Date().toISOString()
                });

                try {
                    await beforeUpdateHook({
                        context,
                        storageOperations,
                        group,
                        input,
                        data
                    });
                    const updatedGroup = await storageOperations.update({
                        group,
                        data,
                        input
                    });
                    await afterUpdateHook({
                        context,
                        storageOperations,
                        group: updatedGroup,
                        data,
                        input
                    });
                    return updatedGroup;
                } catch (ex) {
                    throw new WebinyError(ex.message, ex.code || "UPDATE_ERROR", {
                        ...(ex.data || {}),
                        group,
                        data,
                        input
                    });
                }
            },
            delete: async id => {
                const permission = await checkPermissions("d");

                const group = await groupsGet(id);

                utils.checkOwnership(context, permission, group);

                try {
                    await beforeDeleteHook({
                        context,
                        storageOperations,
                        group
                    });
                    await storageOperations.delete({ group });
                    await afterDeleteHook({
                        context,
                        storageOperations,
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

        context.cms = {
            ...(context.cms || ({} as any)),
            groups
        };
    }
});
