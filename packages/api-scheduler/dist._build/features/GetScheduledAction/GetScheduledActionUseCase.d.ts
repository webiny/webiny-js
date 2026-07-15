import { Result } from "@webiny/feature/api";
import { GetScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
/**
 * Retrieves a scheduled action by its ID
 *
 * Flow:
 * 1. Fetch schedule entry from CMS storage by ID
 * 2. Return null if not found
 * 3. Transform CMS entry to IScheduledAction format
 */
declare class GetScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    private getEntryByIdUseCase;
    private model;
    private permissions;
    private identityContext;
    constructor(getEntryByIdUseCase: GetEntryByIdUseCase.Interface, model: ScheduledActionModel.Interface, permissions: SchedulerPermissions.Interface, identityContext: IdentityContext.Interface);
    execute<T extends GenericRecord>(params: UseCaseAbstraction.Params): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>>;
}
export declare const GetScheduledActionUseCase: typeof GetScheduledActionUseCaseImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("./abstractions.js").IGetScheduledActionUseCase>;
};
export {};
