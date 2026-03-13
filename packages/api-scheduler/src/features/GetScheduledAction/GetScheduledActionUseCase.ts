import { Result } from "@webiny/feature/api";
import { GetScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import {
    NotAuthorizedError,
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError
} from "~/domain/errors.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissions } from "~/domain/permissions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

/**
 * Retrieves a scheduled action by its ID
 *
 * Flow:
 * 1. Fetch schedule entry from CMS storage by ID
 * 2. Return null if not found
 * 3. Transform CMS entry to IScheduledAction format
 */
class GetScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface,
        private model: ScheduledActionModel.Interface,
        private permissions: SchedulerPermissions.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute<T extends GenericRecord>(
        params: UseCaseAbstraction.Params
    ): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canRead("action");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }
        const { id, namespace } = params;
        // Get entry from CMS
        const scheduleId = ScheduledActionIdWithVersion.from(id);
        const entryResult = await this.getEntryByIdUseCase.execute<IScheduledAction<T>>(
            this.model,
            scheduleId
        );

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(scheduleId));
            }

            return Result.fail(new ScheduledActionPersistenceError(entryResult.error));
        }

        const ownRecordsOnly = await this.permissions.onlyOwnRecords("action");
        if (ownRecordsOnly) {
            if (entryResult.value.createdBy.id !== this.identityContext.getIdentity().id) {
                return Result.fail(new NotAuthorizedError());
            }
        }

        const entry = entryResult.value;
        /**
         * Always check if the namespace is correct because entry is loaded directly, not via filtering.
         */
        if (entry.values.namespace !== namespace) {
            return Result.fail(new ScheduledActionNotFoundError(scheduleId));
        }

        return Result.ok({
            id: entry.entryId,
            namespace: entry.values.namespace,
            actionType: entry.values.actionType,
            targetId: entry.values.targetId,
            scheduledBy: entry.values.scheduledBy,
            scheduledFor: entry.values.scheduledFor,
            payload: entry.values.payload,
            title: entry.values.title,
            error: entry.values.error
        });
    }
}

export const GetScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetScheduledActionUseCaseImpl,
    dependencies: [
        GetEntryByIdUseCase,
        ScheduledActionModel,
        SchedulerPermissions.Abstraction,
        IdentityContext
    ]
});
