import { RecordAction as RecordActionAbstraction } from "../abstractions.js";
import type { IScheduleRecord } from "~/scheduler/types.js";
import { ScheduleType } from "~/scheduler/types.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { GetPublishedEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { RepublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/abstractions.js";

/**
 * PublishRecordAction - Handles publish scheduled actions
 *
 * Responsibilities:
 * - Check if record type is publish
 * - Fetch target entry and published entry
 * - Handle three scenarios:
 *   1. Entry not published -> publish it
 *   2. Entry already published (same revision) -> republish it
 *   3. Entry has different published revision -> unpublish old, publish new
 */
class PublishRecordActionImpl implements RecordActionAbstraction.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private getPublishedEntriesByIds: GetPublishedEntriesByIdsUseCase.Interface,
        private publishEntry: PublishEntryUseCase.Interface,
        private republishEntry: RepublishEntryUseCase.Interface,
        private unpublishEntry: UnpublishEntryUseCase.Interface
    ) {}

    public canHandle(record: Pick<IScheduleRecord, "type">): boolean {
        return record.type === ScheduleType.publish;
    }

    public async handle(record: Pick<IScheduleRecord, "targetId" | "model">): Promise<void> {
        const { targetId, model } = record;

        const targetEntryResult = await this.getEntryById.execute(model, targetId);
        if (targetEntryResult.isFail()) {
            throw targetEntryResult.error;
        }

        const targetEntry = targetEntryResult.value;

        const publishedTargetEntryResult = await this.getPublishedEntriesByIds.execute(model, [
            targetEntry.id
        ]);
        if (publishedTargetEntryResult.isFail()) {
            throw publishedTargetEntryResult.error;
        }

        const [publishedTargetEntry] = publishedTargetEntryResult.value;

        /**
         * There are a few scenarios we must handle:
         * 1. target entry is not published
         * 2. target entry is already published, same revision published
         * 3. target entry has a published revision, which is different that the target
         */

        /**
         * 1. Has no published revision, so we can publish it.
         */
        if (!publishedTargetEntry) {
            try {
                await this.publishEntry.execute(model, targetEntry.id);
                return;
            } catch (error) {
                console.error(`Failed to publish entry "${targetId}":`, error);
                throw error;
            }
        } else if (publishedTargetEntry.id === targetEntry.id) {
            /**
             * 2. Target entry is already published.
             */
            /**
             * Already published, nothing to do.
             */
            await this.republishEntry.execute(model, targetEntry.id);
            return;
        }
        /**
         * 3. Target entry has a published revision, which is different from the target.
         */
        await this.unpublishEntry.execute(model, publishedTargetEntry.id);
        await this.publishEntry.execute(model, targetEntry.id);
    }
}

export const PublishRecordAction = RecordActionAbstraction.createImplementation({
    implementation: PublishRecordActionImpl,
    dependencies: [
        GetEntryByIdUseCase,
        GetPublishedEntriesByIdsUseCase,
        PublishEntryUseCase,
        RepublishEntryUseCase,
        UnpublishEntryUseCase
    ]
});
