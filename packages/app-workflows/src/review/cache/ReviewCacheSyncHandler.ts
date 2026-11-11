import type { IReviewCacheWriter } from "./IReviewCacheWriter.js";
import type { ReviewChangedEvent } from "~/review/events/ReviewChangedEvent.js";
import type { ReviewChangedHandler } from "~/review/events/ReviewChangedHandler.js";
import { toSystemWorkflow } from "~/review/domain/toSystemWorkflow.js";

/*
 * The one shared handler that keeps an app's content list cache in step with the review (R213).
 * The only per-app part is the cache writer it is built with. Exported plain: it is never passed
 * to `createImplementation`; each app subclasses it once and registers the subclass.
 */
export class ReviewCacheSyncHandler implements ReviewChangedHandler.Interface {
    constructor(private writer: IReviewCacheWriter) {}

    async handle(event: ReviewChangedEvent): Promise<void> {
        const { namespace, targetId, targetRevisionId, review } = event.payload;
        if (!this.writer.canHandle(namespace)) {
            return;
        }
        const workflow = toSystemWorkflow(review);
        this.writer.write({ namespace, targetId, targetRevisionId }, workflow);
    }
}
