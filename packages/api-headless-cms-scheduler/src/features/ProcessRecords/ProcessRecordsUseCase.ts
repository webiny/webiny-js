import { Result } from "@webiny/feature/api";
import { WebinyError } from "@webiny/error";
import { SCHEDULE_MODEL_ID, SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER } from "~/constants.js";
import { ProcessRecordsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { RecordAction } from "./abstractions.js";
import { createIdentifier } from "@webiny/utils/createIdentifier.js";
import {
    AuthenticatedIdentity,
    IdentityContext
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { CmsModel } from "@webiny/api-headless-cms/types/model.js";
import { SchedulerFactory } from "~/features/Scheduler/index.js";

/**
 * RecordProcessorUseCase - Processes scheduled CMS action events
 *
 * Responsibilities:
 * - Fetch the schedule entry from storage
 * - Set identity to the user who scheduled the action
 * - Find the appropriate action handler
 * - Execute the action
 * - Clean up schedule entry on success or update with error on failure
 */
class ProcessRecordsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private schedulerFactory: SchedulerFactory.Interface,
        private actions: RecordAction.Interface[],
        private identityContext: IdentityContext.Interface,
        private getModel: GetModelUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    public async execute(payload: UseCaseAbstraction.Params): Promise<Result<void, Error>> {
        const values = payload[SCHEDULED_CMS_ACTION_EVENT_IDENTIFIER];

        const model = await this.getModelDefinition(SCHEDULE_MODEL_ID);

        const scheduleEntryId = createIdentifier({
            id: values.id,
            version: 1
        });

        /**
         * Fetch the schedule entry so we know the model it is targeting.
         */
        const scheduleEntryResult = await this.identityContext.withoutAuthorization(() => {
            return this.getEntryById.execute(model, scheduleEntryId);
        });

        if (scheduleEntryResult.isFail()) {
            return Result.fail(scheduleEntryResult.error);
        }

        const scheduleEntry = scheduleEntryResult.value;

        /**
         * We want to mock the identity of the user that scheduled this record.
         */
        this.identityContext.setIdentity(
            new AuthenticatedIdentity({
                id: scheduleEntry.createdBy.id,
                type: scheduleEntry.createdBy.type,
                displayName: scheduleEntry.createdBy.displayName ?? ""
            })
        );

        const targetModel = await this.getModelDefinition(scheduleEntry.values.targetModelId);

        /**
         * We want a formatted schedule record to be used later.
         */
        const scheduler = this.schedulerFactory.useModel(targetModel);
        const scheduleRecord = await scheduler.getScheduled(scheduleEntryId);

        /**
         * Should not happen as we fetched it a few lines up, just in different format.
         */
        if (!scheduleRecord) {
            return Result.fail(
                new WebinyError(
                    `No schedule record found for ID: ${scheduleEntryId}`,
                    "SCHEDULE_RECORD_NOT_FOUND",
                    values
                )
            );
        }

        const action = this.actions.find(action => action.canHandle(scheduleRecord));
        if (!action) {
            await this.updateEntry.execute(model, scheduleEntryId, {
                error: `No action found for schedule record ID.`
            });

            return Result.fail(
                new WebinyError(
                    `No action found for schedule record ID: ${scheduleEntryId}`,
                    "NO_ACTION_FOUND",
                    scheduleRecord
                )
            );
        }

        try {
            await action.handle(scheduleRecord);
        } catch (ex) {
            console.error(`Error while handling schedule record ID: ${scheduleEntryId}`);
            await this.updateEntry.execute(model, scheduleEntryId, {
                error: ex.message
            });
            return Result.fail(ex);
        }

        /**
         * Everything is ok. Delete the schedule record.
         */
        try {
            await this.deleteEntry.execute(model, scheduleEntryId, {
                force: true,
                permanently: true
            });
        } catch {
            // Does not matter if it fails.
        }

        return Result.ok();
    }

    private async getModelDefinition(modelId: string): Promise<CmsModel> {
        const modelResult = await this.identityContext.withoutAuthorization(() => {
            return this.getModel.execute(modelId);
        });

        if (modelResult.isFail()) {
            throw modelResult.error;
        }

        return modelResult.value;
    }
}

export const ProcessRecordsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ProcessRecordsUseCaseImpl,
    dependencies: [
        SchedulerFactory,
        [RecordAction, { multiple: true }],
        IdentityContext,
        GetModelUseCase,
        GetEntryByIdUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase
    ]
});
