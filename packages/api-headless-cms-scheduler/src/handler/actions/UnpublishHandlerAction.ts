import type { IHandlerAction } from "~/handler/types.js";
import type { IScheduleRecord } from "~/scheduler/types.js";
import { ScheduleType } from "~/scheduler/types.js";
import type { ScheduleContext } from "~/types.js";

export type IUnpublishHandlerActionParamsCms = Pick<
    ScheduleContext["cms"],
    "getEntryById" | "getPublishedEntriesByIds" | "unpublishEntry"
>;

export interface IUnpublishHandlerActionParams {
    cms: IUnpublishHandlerActionParamsCms;
}

export class UnpublishHandlerAction implements IHandlerAction {
    private readonly cms: IUnpublishHandlerActionParamsCms;

    public constructor(params: IUnpublishHandlerActionParams) {
        this.cms = params.cms;
    }

    public canHandle(record: Pick<IScheduleRecord, "type">): boolean {
        return record.type === ScheduleType.unpublish;
    }
    public async handle(record: Pick<IScheduleRecord, "targetId" | "model">): Promise<void> {
        const { targetId, model } = record;
        /**
         * We need to handle the following scenarios:
         * * 1. Target entry is not published, nothing to do.
         * * 2. Target entry is published, so we can unpublish it.
         * * 3. Target entry is published, but it's a different revision than the target.
         */
        const targetEntry = await this.cms.getEntryById(model, targetId);
        const [publishedTargetEntry] = await this.cms.getPublishedEntriesByIds(model, [
            targetEntry.id
        ]);

        /**
         * 1. Target entry is not published, nothing to do.
         */
        if (!publishedTargetEntry) {
            console.warn(`Entry "${targetId}" is not published, nothing to unpublish.`);
            return;
        }
        /**
         * 2. Target entry is published, so we can unpublish it.
         */
        //
        else if (publishedTargetEntry.id === targetId) {
            await this.cms.unpublishEntry(model, targetId);
            return;
        }
        /**
         * 3. Target entry is published, but it's a different revision than the target.
         * TODO determine if we really want to unpublish an entry which does not match the target ID.
         */
        await this.cms.unpublishEntry(model, publishedTargetEntry.id);
    }
}
