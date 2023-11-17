import WebinyError from "@webiny/error";
import {
    CmsContext,
    CmsGroup,
    CmsGroupContext,
    HeadlessCmsStorageOperations,
    OnGroupAfterCreateTopicParams,
    OnGroupAfterDeleteTopicParams,
    OnGroupAfterUpdateTopicParams,
    OnGroupBeforeCreateTopicParams,
    OnGroupBeforeDeleteTopicParams,
    OnGroupBeforeUpdateTopicParams,
    OnGroupCreateErrorTopicParams,
    OnGroupDeleteErrorTopicParams,
    OnGroupUpdateErrorTopicParams
} from "~/types";
import { CmsGroupPlugin } from "~/plugins/CmsGroupPlugin";
import { Tenant } from "@webiny/api-tenancy/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeGroupUpdate } from "./contentModelGroup/beforeUpdate";
import { assignBeforeGroupCreate } from "./contentModelGroup/beforeCreate";
import { assignBeforeGroupDelete } from "./contentModelGroup/beforeDelete";
import {
    createGroupCreateValidation,
    createGroupUpdateValidation
} from "~/crud/contentModelGroup/validation";
import { createZodError, mdbid } from "@webiny/utils";
import { ModelGroupsPermissions } from "~/utils/permissions/ModelGroupsPermissions";
import { filterAsync } from "~/utils/filterAsync";
import { createCacheKey, createMemoryCache } from "~/utils";
import { listGroupsFromDatabase } from "~/crud/contentModelGroup/listGroupsFromDatabase";
import { NotFoundError } from "@webiny/handler-graphql";

export interface CreateModelGroupsCrudParams {
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    storageOperations: HeadlessCmsStorageOperations;
    modelGroupsPermissions: ModelGroupsPermissions;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}

export const createModelGroupsCrud = (params: CreateModelGroupsCrudParams): CmsGroupContext => {
    const {
        getTenant,
        getIdentity,
        getLocale,
        storageOperations,
        modelGroupsPermissions,
        context
    } = params;

    const filterGroup = async (group?: CmsGroup) => {
        if (!group) {
            return false;
        }
        const ownsGroup = await modelGroupsPermissions.ensure(
            { owns: group.createdBy },
            { throw: false }
        );

        if (!ownsGroup) {
            return false;
        }

        return await modelGroupsPermissions.canAccessGroup({
            group
        });
    };

    const listDatabaseGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const listFilteredDatabaseGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const listPluginGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const clearGroupsCache = (): void => {
        listPluginGroupsCache.clear();
        listDatabaseGroupsCache.clear();
        listFilteredDatabaseGroupsCache.clear();
    };

    const fetchPluginGroups = (tenant: string, locale: string): Promise<CmsGroup[]> => {
        const pluginGroups = context.plugins.byType<CmsGroupPlugin>(CmsGroupPlugin.type);

        const cacheKey = createCacheKey({
            tenant,
            locale,
            identity: context.security.isAuthorizationEnabled() ? getIdentity()?.id : undefined,
            groups: pluginGroups
                .map(({ contentModelGroup: group }) => {
                    return `${group.id}#${group.slug}#${group.savedOn || "unknown"}`;
                })
                .join("/")
        });

        return listPluginGroupsCache.getOrSet(cacheKey, async (): Promise<CmsGroup[]> => {
            const groups = pluginGroups
                /**
                 * We need to filter out groups that are not for this tenant or locale.
                 * If it does not have tenant or locale define, it is for every locale and tenant
                 */
                .filter(plugin => {
                    const { tenant: t, locale: l } = plugin.contentModelGroup;
                    if (t && t !== tenant) {
                        return false;
                    } else if (l && l !== locale) {
                        return false;
                    }
                    return true;
                })
                .map(plugin => {
                    return {
                        ...plugin.contentModelGroup,
                        tenant,
                        locale,
                        webinyVersion: context.WEBINY_VERSION
                    };
                });
            return filterAsync(groups, filterGroup);
        });
    };

    const fetchGroups = async (tenant: string, locale: string) => {
        const pluginGroups = await fetchPluginGroups(tenant, locale);
        /**
         * Maybe we can cache based on permissions, not the identity id?
         *
         * TODO: @adrian please check if possible.
         */
        const cacheKey = createCacheKey({
            tenant,
            locale
        });
        const databaseGroups = await listDatabaseGroupsCache.getOrSet(cacheKey, async () => {
            return await listGroupsFromDatabase({
                storageOperations,
                tenant,
                locale
            });
        });
        const filteredCacheKey = createCacheKey({
            dbCacheKey: cacheKey.get(),
            identity: context.security.isAuthorizationEnabled() ? getIdentity()?.id : undefined
        });

        const groups = await listFilteredDatabaseGroupsCache.getOrSet(
            filteredCacheKey,
            async () => {
                return filterAsync(databaseGroups, filterGroup);
            }
        );

        return groups.concat(pluginGroups);
    };

    /**
     * Create
     */
    const onGroupBeforeCreate =
        createTopic<OnGroupBeforeCreateTopicParams>("cms.onGroupBeforeCreate");
    const onGroupAfterCreate = createTopic<OnGroupAfterCreateTopicParams>("cms.onGroupAfterCreate");
    const onGroupCreateError = createTopic<OnGroupCreateErrorTopicParams>("cms.onGroupCreateError");
    /**
     * Update
     */
    const onGroupBeforeUpdate =
        createTopic<OnGroupBeforeUpdateTopicParams>("cms.onGroupBeforeUpdate");
    const onGroupAfterUpdate = createTopic<OnGroupAfterUpdateTopicParams>("cms.onGroupAfterUpdate");
    const onGroupUpdateError = createTopic<OnGroupUpdateErrorTopicParams>("cms.onGroupUpdateError");
    /**
     * Delete
     */
    const onGroupBeforeDelete =
        createTopic<OnGroupBeforeDeleteTopicParams>("cms.onGroupBeforeDelete");
    const onGroupAfterDelete = createTopic<OnGroupAfterDeleteTopicParams>("cms.onGroupAfterDelete");
    const onGroupDeleteError = createTopic<OnGroupDeleteErrorTopicParams>("cms.onGroupDeleteError");

    /**
     * We need to assign some default behaviors.
     */
    assignBeforeGroupCreate({
        onGroupBeforeCreate,
        plugins: context.plugins,
        storageOperations
    });
    assignBeforeGroupUpdate({
        onGroupBeforeUpdate,
        plugins: context.plugins
    });
    assignBeforeGroupDelete({
        onGroupBeforeDelete,
        plugins: context.plugins,
        storageOperations
    });
    /**
     * CRUD Methods
     */
    const getGroup: CmsGroupContext["getGroup"] = async id => {
        await modelGroupsPermissions.ensure({ rwd: "r" });

        const groups = await context.security.withoutAuthorization(async () => {
            return fetchGroups(getTenant().id, getLocale().code);
        });
        const group = groups.find(group => group.id === id);
        if (!group) {
            throw new NotFoundError(`Cms Group "${id}" was not found!`);
        }

        await modelGroupsPermissions.ensure({ owns: group.createdBy });
        await modelGroupsPermissions.ensureCanAccessGroup({
            group
        });

        return group;
    };

    const listGroups: CmsGroupContext["listGroups"] = async params => {
        const { where } = params || {};

        const { tenant, locale } = where || {};

        await modelGroupsPermissions.ensure({ rwd: "r" });

        return fetchGroups(tenant || getTenant().id, locale || getLocale().code);
    };

    const createGroup: CmsGroupContext["createGroup"] = async input => {
        await modelGroupsPermissions.ensure({ rwd: "w" });

        const result = await createGroupCreateValidation().safeParseAsync(input);

        if (!result.success) {
            throw createZodError(result.error);
        }
        const data = result.data;

        const identity = getIdentity();

        const id = data.id || mdbid();
        const group: CmsGroup = {
            ...data,
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
            await onGroupBeforeCreate.publish({
                group
            });

            const result = await storageOperations.groups.create({
                group
            });

            clearGroupsCache();

            await onGroupAfterCreate.publish({
                group: result
            });

            return group;
        } catch (ex) {
            await onGroupCreateError.publish({
                input,
                group,
                error: ex
            });
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
    };
    const updateGroup: CmsGroupContext["updateGroup"] = async (id, input) => {
        await modelGroupsPermissions.ensure({ rwd: "w" });

        const original = await getGroup(id);

        await modelGroupsPermissions.ensure({ owns: original.createdBy });

        const result = await createGroupUpdateValidation().safeParseAsync(input);

        if (!result.success) {
            throw createZodError(result.error);
        }
        const data = result.data;

        /**
         * No need to continue if no values were changed
         */
        if (Object.keys(data).length === 0) {
            return original;
        }

        const group: CmsGroup = {
            ...original,
            ...data,
            locale: getLocale().code,
            tenant: getTenant().id,
            savedOn: new Date().toISOString()
        };

        try {
            await onGroupBeforeUpdate.publish({
                original,
                group
            });

            const updatedGroup = await storageOperations.groups.update({
                group
            });
            clearGroupsCache();

            await onGroupAfterUpdate.publish({
                original,
                group: updatedGroup
            });

            return updatedGroup;
        } catch (ex) {
            await onGroupUpdateError.publish({
                input,
                original,
                group,
                error: ex
            });
            throw new WebinyError(ex.message, ex.code || "UPDATE_ERROR", {
                error: ex,
                original,
                group,
                input
            });
        }
    };
    const deleteGroup: CmsGroupContext["deleteGroup"] = async id => {
        await modelGroupsPermissions.ensure({ rwd: "d" });

        const group = await getGroup(id);

        await modelGroupsPermissions.ensure({ owns: group.createdBy });

        try {
            await onGroupBeforeDelete.publish({
                group
            });

            await storageOperations.groups.delete({ group });
            clearGroupsCache();

            await onGroupAfterDelete.publish({
                group
            });
        } catch (ex) {
            await onGroupDeleteError.publish({
                group,
                error: ex
            });
            throw new WebinyError(ex.message, ex.code || "DELETE_ERROR", {
                ...(ex.data || {}),
                id
            });
        }

        return true;
    };

    return {
        onGroupBeforeCreate,
        onGroupAfterCreate,
        onGroupCreateError,
        onGroupBeforeUpdate,
        onGroupAfterUpdate,
        onGroupUpdateError,
        onGroupBeforeDelete,
        onGroupAfterDelete,
        onGroupDeleteError,
        clearGroupsCache,
        getGroup: async id => {
            return context.benchmark.measure("headlessCms.crud.groups.getGroup", async () => {
                return getGroup(id);
            });
        },
        listGroups: async params => {
            return context.benchmark.measure("headlessCms.crud.groups.listGroups", async () => {
                return listGroups(params);
            });
        },
        createGroup: async input => {
            return context.benchmark.measure("headlessCms.crud.groups.createGroup", async () => {
                return createGroup(input);
            });
        },
        updateGroup: async (id, input) => {
            return context.benchmark.measure("headlessCms.crud.groups.updateGroup", async () => {
                return updateGroup(id, input);
            });
        },
        deleteGroup: async id => {
            return context.benchmark.measure("headlessCms.crud.groups.deleteGroup", async () => {
                return deleteGroup(id);
            });
        }
    };
};
