import { Result } from "@webiny/feature/api";
import { CancelScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";
/**
 * Cancels a scheduled action
 *
 * Flow:
 * 1. Check if schedule exists
 * 2. Delete EventBridge schedule
 * 3. Delete CMS entry
 * 4. If EventBridge delete fails, continue anyway (schedule might already be executed/deleted)
 */
declare class CancelScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    private getScheduledActionUseCase;
    private schedulerService;
    private deleteEntryUseCase;
    private model;
    private permissions;
    constructor(getScheduledActionUseCase: GetScheduledActionUseCase.Interface, schedulerService: SchedulerService.Interface, deleteEntryUseCase: DeleteEntryUseCase.Interface, model: ScheduledActionModel.Interface, permissions: SchedulerPermissions.Interface);
    execute(params: UseCaseAbstraction.Params): Promise<Result<boolean, UseCaseAbstraction.Error>>;
}
export declare const CancelScheduledActionUseCase: typeof CancelScheduledActionUseCaseImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("./abstractions.js").ICancelScheduledActionUseCase>;
};
export {};
