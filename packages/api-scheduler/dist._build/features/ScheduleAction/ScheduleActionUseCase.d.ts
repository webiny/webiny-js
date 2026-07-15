import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ScheduleActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { NamespaceHandlerExecutioner } from "~/features/NamespaceHandler/abstractions.js";
/**
 * Schedules an action for future execution
 *
 * Flow:
 * 1. Generate unique schedule ID from namespace+actionType+targetId
 * 2. Check if schedule already exists (for rescheduling logic)
 * 3. If exists: UPDATE schedule entry + EventBridge schedule
 * 4. If new: CREATE schedule entry + EventBridge schedule
 * 5. Rollback schedule entry if EventBridge fails
 */
declare class ScheduleActionUseCaseImpl implements UseCaseAbstraction.Interface {
    private identityContext;
    private model;
    private schedulerService;
    private getScheduledAction;
    private createEntryUseCase;
    private updateEntryUseCase;
    private deleteEntryUseCase;
    private namespaceHandlerExecutioner;
    constructor(identityContext: IdentityContext.Interface, model: ScheduledActionModel.Interface, schedulerService: SchedulerService.Interface, getScheduledAction: GetScheduledActionUseCase.Interface, createEntryUseCase: CreateEntryUseCase.Interface, updateEntryUseCase: UpdateEntryUseCase.Interface, deleteEntryUseCase: DeleteEntryUseCase.Interface, namespaceHandlerExecutioner: NamespaceHandlerExecutioner.Interface);
    execute<T extends GenericRecord>(params: UseCaseAbstraction.Params): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>>;
    /**
     * Creates a new schedule
     */
    private createSchedule;
    /**
     * Updates an existing schedule (reschedule)
     */
    private reschedule;
}
export declare const ScheduleActionUseCase: typeof ScheduleActionUseCaseImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("./abstractions.js").IScheduleActionUseCase>;
};
export {};
