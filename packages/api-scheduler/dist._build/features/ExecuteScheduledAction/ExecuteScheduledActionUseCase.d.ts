import { Result } from "@webiny/feature/api";
import { ExecuteScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionHandler, ScheduledActionModel } from "~/shared/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
/**
 * Executes a scheduled action
 *
 * Flow:
 * 1. Load scheduled action from CMS
 * 2. Find registered handler for namespace + actionType
 * 3. Execute handler
 * 4. Delete schedule entry on success
 * 5. Update entry with error on failure (for debugging/audit)
 */
declare class ExecuteScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    private getScheduledActionUseCase;
    private actionHandler;
    private deleteEntryUseCase;
    private updateEntryUseCase;
    private model;
    private identityContext;
    constructor(getScheduledActionUseCase: GetScheduledActionUseCase.Interface, actionHandler: ScheduledActionHandler.Interface, deleteEntryUseCase: DeleteEntryUseCase.Interface, updateEntryUseCase: UpdateEntryUseCase.Interface, model: ScheduledActionModel.Interface, identityContext: IdentityContext.Interface);
    execute<T extends GenericRecord>(params: UseCaseAbstraction.Params): Promise<Result<void, UseCaseAbstraction.Error>>;
    private executeAction;
}
export declare const ExecuteScheduledActionUseCase: typeof ExecuteScheduledActionUseCaseImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("./abstractions.js").IExecuteScheduledActionUseCase>;
};
export {};
