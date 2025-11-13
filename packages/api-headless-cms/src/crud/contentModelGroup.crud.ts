import WebinyError from "@webiny/error";
import type {
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
} from "~/types/index.js";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeGroupDelete } from "./contentModelGroup/beforeDelete.js";
import { createMemoryCache } from "~/utils/index.js";
import type { AccessControl } from "./AccessControl/AccessControl.js";
import { GetGroupUseCase } from "~/features/contentModelGroup/GetGroup/index.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { CreateGroupUseCase } from "~/features/contentModelGroup/CreateGroup/index.js";
import { UpdateGroupUseCase } from "~/features/contentModelGroup/UpdateGroup/index.js";

export interface CreateModelGroupsCrudParams {
    storageOperations: HeadlessCmsStorageOperations;
    accessControl: AccessControl;
    context: CmsContext;
}

export const createModelGroupsCrud = (params: CreateModelGroupsCrudParams): CmsGroupContext => {
    const { storageOperations, accessControl, context } = params;

    const listDatabaseGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const listFilteredDatabaseGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const listPluginGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const clearGroupsCache = (): void => {
        listPluginGroupsCache.clear();
        listDatabaseGroupsCache.clear();
        listFilteredDatabaseGroupsCache.clear();
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
    assignBeforeGroupDelete({
        onGroupBeforeDelete,
        plugins: context.plugins,
        storageOperations
    });
    /**
     * CRUD Methods
     */
    const getGroup: CmsGroupContext["getGroup"] = async id => {
        const useCase = context.container.resolve(GetGroupUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            const error = result.error;
            throw new WebinyError(error.message, error.code, error.data);
        }

        return result.value;
    };

    const listGroups: CmsGroupContext["listGroups"] = async params => {
        const useCase = context.container.resolve(ListGroupsUseCase);
        const result = await useCase.execute();

        if (result.isFail()) {
            const error = result.error;

            throw new WebinyError(error.message, error.code, error.data);
        }

        return result.value;
    };

    const createGroup: CmsGroupContext["createGroup"] = async input => {
        const useCase = context.container.resolve(CreateGroupUseCase);
        const result = await useCase.execute(input);

        if (result.isFail()) {
            const error = result.error;
            throw new WebinyError(error.message, error.code, error.data);
        }

        return result.value;
    };
    const updateGroup: CmsGroupContext["updateGroup"] = async (id, input) => {
        const useCase = context.container.resolve(UpdateGroupUseCase);
        const result = await useCase.execute(id, input);

        if (result.isFail()) {
            const error = result.error;
            throw new WebinyError(error.message, error.code, error.data);
        }

        return result.value;
    };
    const deleteGroup: CmsGroupContext["deleteGroup"] = async id => {
        await accessControl.ensureCanAccessGroup({ rwd: "d" });

        const group = await getGroup(id);

        await accessControl.ensureCanAccessGroup({ group });

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
