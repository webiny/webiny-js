import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { IListScheduledActionsParams, IListScheduledActionsResponse, ListScheduledActionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
/**
 * Lists scheduled actions with optional filtering
 *
 * Flow:
 * 1. Build query filters based on where params (namespace, actionType, targetId, etc.)
 * 2. Fetch entries from CMS storage with pagination and sorting
 * 3. Transform CMS entries to IScheduledAction format
 * 4. Return paginated results with metadata
 */
declare class ListScheduledActionsUseCaseImpl implements UseCaseAbstraction.Interface {
    private listEntriesUseCase;
    private model;
    private cmsWhereMapper;
    private cmsSortMapper;
    private permissions;
    private identityContext;
    constructor(listEntriesUseCase: ListLatestEntriesUseCase.Interface, model: ScheduledActionModel.Interface, cmsWhereMapper: CmsWhereMapper.Interface, cmsSortMapper: CmsSortMapper.Interface, permissions: SchedulerPermissions.Interface, identityContext: IdentityContext.Interface);
    execute<T extends GenericRecord>(params: IListScheduledActionsParams): Promise<Result<IListScheduledActionsResponse<T>, UseCaseAbstraction.Error>>;
}
export declare const ListScheduledActionsUseCase: typeof ListScheduledActionsUseCaseImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("./abstractions.js").IListScheduledActionsUseCase>;
};
export {};
