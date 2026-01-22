import { ScheduledActionHandler } from "@webiny/api-scheduler";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { GetPublishedEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry";
import { RepublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry";
import type { IScheduleActionWithPayload } from "~/features/ScheduleEntryAction/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Handler for publishing CMS entries
 *
 * Handles the "Publish" action for CMS entries with namespace pattern: Cms/Entry/{modelId}
 *
 * Publishing logic:
 * 1. If entry is not published -> publish it
 * 2. If the same revision is already published -> republish it
 * 3. If a different revision is published -> unpublish old, publish new
 */
class PublishEntryActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface,
        private getPublishedEntriesByIdsUseCase: GetPublishedEntriesByIdsUseCase.Interface,
        private publishEntryUseCase: PublishEntryUseCase.Interface,
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private republishEntryUseCase: RepublishEntryUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    public canHandle(namespace: string, actionType: string): boolean {
        return namespace.startsWith("Cms/Entry/") && actionType === "Publish";
    }

    public async handle(action: IScheduleActionWithPayload): Promise<void> {
        const { payload } = action;

        const modelId = payload.modelId as string;

        // Fetch the model
        const modelResult = await this.getModelUseCase.execute(modelId);
        if (modelResult.isFail()) {
            console.error(
                `Failed to get model "${modelId}" for scheduled publish action:`,
                modelResult.error,
                {
                    identity: this.identityContext.getIdentity()
                }
            );
            throw new Error(`Model not found: ${modelId}`);
        }

        const model = modelResult.value;

        // Fetch the target entry
        const targetEntryResult =
            await this.getEntryByIdUseCase.execute<IScheduleActionWithPayload>(
                model,
                action.targetId
            );
        if (targetEntryResult.isFail()) {
            console.error(
                `Failed to get entry "${action.targetId}" for scheduled publish action:`,
                targetEntryResult.error
            );
            throw new Error(`Entry not found: ${action.targetId}`);
        }

        const targetEntry = targetEntryResult.value;

        // Get published entries
        const publishedEntriesResult =
            await this.getPublishedEntriesByIdsUseCase.execute<IScheduleActionWithPayload>(model, [
                targetEntry.id
            ]);

        if (publishedEntriesResult.isFail()) {
            console.error(
                `Failed to get published entries for "${targetEntry.id}":`,
                publishedEntriesResult.error
            );
            throw new Error(`Failed to check published entries`);
        }

        const [publishedTargetEntry] = publishedEntriesResult.value;

        /**
         * Scenario 1: Entry has no published revision -> publish it
         */
        if (!publishedTargetEntry) {
            const publishResult =
                await this.publishEntryUseCase.execute<IScheduleActionWithPayload>(
                    model,
                    targetEntry.id
                );
            if (publishResult.isFail()) {
                console.error(`Failed to publish entry "${action.targetId}":`, publishResult.error);
                throw new Error(`Failed to publish entry: ${action.targetId}`);
            }
            return;
        }

        /**
         * Scenario 2: Target entry is already published (same revision) -> republish it
         */
        if (publishedTargetEntry.id === targetEntry.id) {
            const republishResult = await this.republishEntryUseCase.execute(model, targetEntry.id);
            if (republishResult.isFail()) {
                console.error(
                    `Failed to republish entry "${action.targetId}":`,
                    republishResult.error
                );
                throw new Error(`Failed to republish entry: ${action.targetId}`);
            }
            return;
        }

        /**
         * Scenario 3: A different revision is published -> unpublish old, publish new
         */
        const unpublishResult =
            await this.unpublishEntryUseCase.execute<IScheduleActionWithPayload>(
                model,
                publishedTargetEntry.id
            );
        if (unpublishResult.isFail()) {
            console.error(
                `Failed to unpublish old revision "${publishedTargetEntry.id}":`,
                unpublishResult.error
            );
            throw new Error(`Failed to unpublish old revision: ${publishedTargetEntry.id}`);
        }

        const publishResult = await this.publishEntryUseCase.execute<IScheduleActionWithPayload>(
            model,
            targetEntry.id
        );
        if (publishResult.isFail()) {
            console.error(`Failed to publish entry "${action.targetId}":`, publishResult.error);
            throw new Error(`Failed to publish entry: ${action.targetId}`);
        }
    }
}

export const PublishEntryActionHandler = ScheduledActionHandler.createImplementation({
    implementation: PublishEntryActionHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetEntryByIdUseCase,
        GetPublishedEntriesByIdsUseCase,
        PublishEntryUseCase,
        UnpublishEntryUseCase,
        RepublishEntryUseCase,
        IdentityContext
    ]
});
