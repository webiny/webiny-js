import type { IncomingGenericData } from "@webiny/app-websockets/types.js";
import type { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import type { IReviewContentAdapter } from "~/review/content/IReviewContentAdapter.js";
import { WORKFLOWS_NOTIFICATION_ACTION } from "~/review/domain/constants.js";
import type { ReviewNotificationService } from "~/review/notifications/abstractions.js";
import type { WorkflowsNotificationData } from "~/review/notifications/abstractions.js";

interface WorkflowsNotificationMessage extends IncomingGenericData {
    data?: WorkflowsNotificationData;
}

/*
 * Turns `workflows.notification` websocket messages of one app into toasts. Exported as a plain
 * class; each app subclasses it in its own file and binds the subclass to `WebsocketEventHandler`,
 * so the handler of one app ignores the namespaces of the other (R223).
 */
export class ReviewNotificationHandler implements WebsocketEventHandler.Interface {
    constructor(
        private service: ReviewNotificationService.Interface,
        private adapter: IReviewContentAdapter
    ) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== WORKFLOWS_NOTIFICATION_ACTION) {
            return;
        }

        // The envelope is `{ action, data }`; the data is the phase 7 contract (R187). A malformed
        // message is ignored rather than allowed to throw inside the event publisher.
        const message: WorkflowsNotificationMessage = event.payload;
        const data = message.data;
        if (!data || typeof data.namespace !== "string") {
            return;
        }
        if (!this.adapter.canHandle(data.namespace)) {
            return;
        }

        // A toast must never break the event publisher: a failure is logged and dropped.
        try {
            const url = this.adapter.getContentUrl({
                namespace: data.namespace,
                targetId: data.targetId,
                targetRevisionId: data.targetRevisionId,
                contentTypeId: null
            });
            this.service.handle({ data, url });
        } catch (error) {
            console.error("[ReviewNotificationHandler] A notification failed.", error);
        }
    }
}
