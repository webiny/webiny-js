import WebinyError from "@webiny/error";
import { BenchmarkAbstraction } from "@webiny/api";
import type { CmsContext, CmsGroup, CmsGroupContext } from "~/types/index.js";
import { createMemoryCache } from "~/utils/index.js";
import { GetGroupUseCase } from "~/features/contentModelGroup/GetGroup/index.js";
import { ListGroupsUseCase } from "~/features/contentModelGroup/ListGroups/index.js";
import { CreateGroupUseCase } from "~/features/contentModelGroup/CreateGroup/index.js";
import { UpdateGroupUseCase } from "~/features/contentModelGroup/UpdateGroup/index.js";
import { DeleteGroupUseCase } from "~/features/contentModelGroup/DeleteGroup/index.js";

export interface CreateModelGroupsCrudParams {
    context: CmsContext;
}

export const createModelGroupsCrud = (params: CreateModelGroupsCrudParams): CmsGroupContext => {
    const { context } = params;
    const benchmark = context.container.resolve(BenchmarkAbstraction);

    const listDatabaseGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const listFilteredDatabaseGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const listPluginGroupsCache = createMemoryCache<Promise<CmsGroup[]>>();
    const clearGroupsCache = (): void => {
        listPluginGroupsCache.clear();
        listDatabaseGroupsCache.clear();
        listFilteredDatabaseGroupsCache.clear();
    };

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

    const listGroups: CmsGroupContext["listGroups"] = async () => {
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
        const useCase = context.container.resolve(DeleteGroupUseCase);
        const result = await useCase.execute(id);

        if (result.isFail()) {
            const error = result.error;
            throw new WebinyError(error.message, error.code, error.data);
        }

        return true;
    };

    return {
        clearGroupsCache,
        getGroup: async id => {
            return benchmark.measure("headlessCms.crud.groups.getGroup", async () => {
                return getGroup(id);
            });
        },
        listGroups: async params => {
            return benchmark.measure("headlessCms.crud.groups.listGroups", async () => {
                return listGroups(params);
            });
        },
        createGroup: async input => {
            return benchmark.measure("headlessCms.crud.groups.createGroup", async () => {
                return createGroup(input);
            });
        },
        updateGroup: async (id, input) => {
            return benchmark.measure("headlessCms.crud.groups.updateGroup", async () => {
                return updateGroup(id, input);
            });
        },
        deleteGroup: async id => {
            return benchmark.measure("headlessCms.crud.groups.deleteGroup", async () => {
                return deleteGroup(id);
            });
        }
    };
};
