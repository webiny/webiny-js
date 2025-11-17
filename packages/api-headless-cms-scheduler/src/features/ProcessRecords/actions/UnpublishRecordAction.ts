import { RecordAction as RecordActionAbstraction } from "../abstractions.js";
import type { IScheduleRecord } from "~/scheduler/types.js";
import { ScheduleType } from "~/scheduler/types.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { GetPublishedEntriesByIdsUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetPublishedEntriesByIds/index.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";

/**
 * UnpublishRecordAction - Handles unpublish scheduled actions
 *
 * Responsibilities:
 * - Check if record type is unpublish
 * - Fetch target entry and published entry
 * - Handle three scenarios:
 *   1. Entry not published -> nothing to do
 *   2. Entry published (same revision) -> unpublish it
 *   3. Entry has different published revision -> unpublish the published one
 */
class UnpublishRecordActionImpl implements RecordActionAbstraction.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private getPublishedEntriesByIds: GetPublishedEntriesByIdsUseCase.Interface,
        private unpublishEntry: UnpublishEntryUseCase.Interface
    ) {}

    public canHandle(record: Pick<IScheduleRecord, "type">): boolean {
        return record.type === ScheduleType.unpublish;
    }

    public async handle(record: Pick<IScheduleRecord, "targetId" | "model">): Promise<void> {
        const { targetId, model } = record;

        /**
         * We need to handle the following scenarios:
         * 1. Target entry is not published, nothing to do.
         * 2. Target entry is published, so we can unpublish it.
         * 3. Target entry is published, but it's a different revision than the target.
         */

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
         * 1. Target entry is not published, nothing to do.
         */
        if (!publishedTargetEntry) {
            console.warn(`Entry "${targetId}" is not published, nothing to unpublish.`);
            return;
        } else if (publishedTargetEntry.id === targetId) {
            /**
             * 2. Target entry is published, so we can unpublish it.
             */
            await this.unpublishEntry.execute(model, targetId);
            return;
        }
        /**
         * 3. Target entry is published, but it's a different revision than the target.
         * TODO determine if we really want to unpublish an entry which does not match the target ID.
         */
        await this.unpublishEntry.execute(model, publishedTargetEntry.id);
    }
}

export const UnpublishRecordAction = RecordActionAbstraction.createImplementation({
    implementation: UnpublishRecordActionImpl,
    dependencies: [GetEntryByIdUseCase, GetPublishedEntriesByIdsUseCase, UnpublishEntryUseCase]
});
