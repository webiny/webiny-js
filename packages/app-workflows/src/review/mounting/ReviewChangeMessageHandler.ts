import type { IncomingGenericData } from "@webiny/app-websockets/types.js";
import type { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import type { ReviewActivity } from "~/review/activity/abstractions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "~/review/domain/constants.js";
import type { WorkflowReviewChangedData } from "~/review/notifications/abstractions.js";

interface WorkflowReviewChangedMessage extends IncomingGenericData {
    data?: WorkflowReviewChangedData;
}

/*
 * Turns `workflows.reviewChanged` websocket messages of one app into a refetch signal (R253,
 * R260). The message is silent: nothing is shown, the bar, the drawer, the lists and the widgets
 * refetch what shows the review. Exported as a plain class; each app subclasses it in its own
 * file and binds the subclass to `WebsocketEventHandler`, so the handler of one app ignores the
 * namespaces of the other (R237). `ReviewActivity.notify` isolates listener failures, so a
 * failing listener cannot break the event publisher.
 */
export class ReviewChangeMessageHandler implements WebsocketEventHandler.Interface {
    constructor(
        private activity: ReviewActivity.Interface,
        private adapter: IReviewContentAdapter
    ) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== WORKFLOWS_REVIEW_CHANGED_ACTION) {
            return;
        }

        // The envelope is `{ action, data }`. A malformed message is ignored rather than allowed
        // to throw inside the event publisher.
        const message: WorkflowReviewChangedMessage = event.payload;
        const data = message.data;
        if (!data || typeof data.namespace !== "string") {
            return;
        }
        if (!this.adapter.canHandle(data.namespace)) {
            return;
        }

        let reviewId: string | null = null;
        if (typeof data.reviewId === "string") {
            reviewId = data.reviewId;
        }
        let targetRevisionId: string | null = null;
        if (typeof data.targetRevisionId === "string") {
            targetRevisionId = data.targetRevisionId;
        }

        this.activity.notify({
            namespace: data.namespace,
            source: "remote",
            reviewId,
            targetRevisionId
        });
    }
}
