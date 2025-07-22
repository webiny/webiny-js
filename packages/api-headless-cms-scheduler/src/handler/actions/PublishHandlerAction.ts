import type { IHandlerAction } from "~/handler/types.js";
import type { IScheduleRecord } from "~/scheduler/types.js";
import { ScheduleType } from "~/scheduler/types.js";
import type { ScheduleContext } from "~/types.js";

export type IPublishHandlerActionParamsCms = Pick<
    ScheduleContext["cms"],
    | "getEntryById"
    | "getPublishedEntriesByIds"
    | "publishEntry"
    | "unpublishEntry"
    | "republishEntry"
>;

export interface IPublishHandlerActionParams {
    cms: IPublishHandlerActionParamsCms;
}

export class PublishHandlerAction implements IHandlerAction {
    private readonly cms: IPublishHandlerActionParamsCms;

    public constructor(params: IPublishHandlerActionParams) {
        this.cms = params.cms;
    }

    public canHandle(record: Pick<IScheduleRecord, "type">): boolean {
        return record.type === ScheduleType.publish;
    }

    public async handle(record: Pick<IScheduleRecord, "targetId" | "model">): Promise<void> {
        const { targetId, model } = record;
        const targetEntry = await this.cms.getEntryById(model, targetId);
        const [publishedTargetEntry] = await this.cms.getPublishedEntriesByIds(model, [
            targetEntry.id
        ]);
        /**
         * There are few scenarios we must handle:
         * 1. target entry is not published
         * 2. target entry is already published, same revision published
         * 3. target entry has a published revision, which is different that the target
         */

        /**
         * 1. Has no published revision, so we can publish it.
         */
        if (!publishedTargetEntry) {
            try {
                await this.cms.publishEntry(model, targetEntry.id);
                return;
            } catch (error) {
                console.error(`Failed to publish entry "${targetId}":`, error);
                throw error;
            }
        }
        /**
         * 2. Target entry is already published.
         */
        //
        else if (publishedTargetEntry.id === targetEntry.id) {
            /**
             * Already published, nothing to do.
             * Maybe republish?
             * TODO Do we throw an error here?
             */
            await this.cms.republishEntry(model, targetEntry.id);
            return;
        }
        /**
         * 3. Target entry has a published revision, which is different from the target.
         */
        //
        await this.cms.unpublishEntry(model, publishedTargetEntry.id);
        await this.cms.publishEntry(model, targetEntry.id);
    }
}
