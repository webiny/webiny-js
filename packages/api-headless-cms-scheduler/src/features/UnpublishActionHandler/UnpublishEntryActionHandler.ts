import {
    type IScheduledAction,
    ScheduledActionHandler,
    ScheduledActionTypeUnpublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetPublishedEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry";
import type { IScheduledActionPayload } from "~/types.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import type { ScheduledActionType } from "@webiny/api-scheduler/shared/abstractions.js";

/**
 * Handler for unpublishing CMS entries
 *
 * Handles the "Unpublish" action for CMS entries with namespace pattern: Cms/Entry/{modelId}
 *
 * Unpublishing logic:
 * 1. If entry is not published -> nothing to do (warn)
 * 2. If target entry is published (same revision) -> unpublish it
 * 3. If a different revision is published -> unpublish it anyway
 */
class UnpublishEntryActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface,
        private getPublishedEntriesByIdsUseCase: GetPublishedEntriesByIdsUseCase.Interface,
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface
    ) {}

    canHandle(namespace: string, actionType: ScheduledActionType): boolean {
        const modelId = extractModelIdFromNamespace(namespace);
        if (!modelId) {
            return false;
        }
        return actionType === ScheduledActionTypeUnpublish;
    }

    async handle(action: IScheduledAction<IScheduledActionPayload>): Promise<void> {
        const { payload } = action;

        const modelId = payload.modelId as string;

        // Fetch the model
        const modelResult = await this.getModelUseCase.execute(modelId);
        if (modelResult.isFail()) {
            console.error(
                `Failed to get model "${modelId}" for scheduled unpublish action:`,
                modelResult.error
            );
            throw new Error(`Model not found: ${modelId}`);
        }

        const model = modelResult.value;

        // Fetch the target entry
        const targetEntryResult = await this.getEntryByIdUseCase.execute<
            IScheduledAction<IScheduledActionPayload>
        >(model, action.targetId);
        if (targetEntryResult.isFail()) {
            console.error(
                `Failed to get entry "${action.targetId}" for scheduled unpublish action:`,
                targetEntryResult.error
            );
            throw new Error(`Entry not found: ${action.targetId}`);
        }

        const targetEntry = targetEntryResult.value;

        // Get published entries
        const publishedEntriesResult = await this.getPublishedEntriesByIdsUseCase.execute<
            IScheduledAction<IScheduledActionPayload>
        >(model, [targetEntry.id]);

        if (publishedEntriesResult.isFail()) {
            console.error(
                `Failed to get published entries for "${targetEntry.id}":`,
                publishedEntriesResult.error
            );
            throw new Error(`Failed to check published entries`);
        }

        const [publishedTargetEntry] = publishedEntriesResult.value;

        /**
         * Scenario 1: Entry is not published -> nothing to do
         */
        if (!publishedTargetEntry) {
            console.warn(`Entry "${action.targetId}" is not published, nothing to unpublish.`);
            return;
        }

        /**
         * Scenario 2: Target entry is published (same revision) -> unpublish it
         */
        if (publishedTargetEntry.id === action.targetId) {
            const unpublishResult = await this.unpublishEntryUseCase.execute<
                IScheduledAction<IScheduledActionPayload>
            >(model, action.targetId);
            if (unpublishResult.isFail()) {
                console.error(
                    `Failed to unpublish entry "${action.targetId}":`,
                    unpublishResult.error
                );
                throw new Error(`Failed to unpublish entry: ${action.targetId}`);
            }
            return;
        }

        /**
         * Scenario 3: A different revision is published -> unpublish it anyway
         * TODO: Determine if we really want to unpublish an entry which does not match the target ID
         */
        const unpublishResult = await this.unpublishEntryUseCase.execute<
            IScheduledAction<IScheduledActionPayload>
        >(model, publishedTargetEntry.id);
        if (unpublishResult.isFail()) {
            console.error(
                `Failed to unpublish published revision "${publishedTargetEntry.id}":`,
                unpublishResult.error
            );
            throw new Error(`Failed to unpublish entry: ${publishedTargetEntry.id}`);
        }
    }
}

export const UnpublishEntryActionHandler = ScheduledActionHandler.createImplementation({
    implementation: UnpublishEntryActionHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetEntryByIdUseCase,
        GetPublishedEntriesByIdsUseCase,
        UnpublishEntryUseCase
    ]
});
