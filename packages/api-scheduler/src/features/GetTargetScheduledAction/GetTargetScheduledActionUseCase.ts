import { Result } from "@webiny/feature/api";
import { GetTargetScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { IScheduledAction, IScheduledActionEntryValues } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import {
    NotAuthorizedError,
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError
} from "~/domain/errors.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "~/domain/ScheduledActionMapper.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import { SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH } from "~/constants.js";

/**
 * Retrieves a scheduled action by its ID
 *
 * Flow:
 * 1. Fetch schedule entry from CMS storage by ID
 * 2. Return null if not found
 * 3. Transform CMS entry to IScheduledAction format
 */
class GetTargetScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
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

        const entryResult = await this.getRecord<T>(params);

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(id));
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
            return Result.fail(new ScheduledActionNotFoundError(id));
        }
        const action = ScheduledActionMapper.toAction<T>(entry);
        return Result.ok(action);
    }
    /**
     * We always need to fetch both publish and unpublish actions because we don't know the type of the action that is being searched for.
     */
    private async getRecord<T extends GenericRecord>(params: UseCaseAbstraction.Params) {
        const schedulePublishId = ScheduledActionId.from({
            namespace: params.namespace,
            targetId: params.id,
            actionType: SCHEDULED_ACTION_PUBLISH
        });
        const publishResult = await this.getEntryByIdUseCase.execute<
            IScheduledActionEntryValues<T>
        >(this.model, ScheduledActionIdWithVersion.from(schedulePublishId));
        if (publishResult.isOk()) {
            return publishResult;
        }
        const scheduleUnpublishId = ScheduledActionId.from({
            namespace: params.namespace,
            targetId: params.id,
            actionType: SCHEDULED_ACTION_UNPUBLISH
        });
        return this.getEntryByIdUseCase.execute<IScheduledActionEntryValues<T>>(
            this.model,
            ScheduledActionIdWithVersion.from(scheduleUnpublishId)
        );
    }
}

export const GetTargetScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetTargetScheduledActionUseCaseImpl,
    dependencies: [GetEntryByIdUseCase, ScheduledActionModel, SchedulerPermissions, IdentityContext]
});
