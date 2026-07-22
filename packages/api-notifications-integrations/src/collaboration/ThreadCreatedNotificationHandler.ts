import { CollabThreadCreatedHandler } from "@webiny/api-collaboration/domain/thread/events.js";
import { CreateNotificationUseCase } from "@webiny/api-notifications/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/api-notifications/domain/notification/abstractions.js";
import { APP_HEADLESS_CMS } from "~/constants.js";

/**
 * A new comment thread -> notify everyone mentioned in the first message.
 */
class ThreadCreatedNotificationHandlerImpl implements CollabThreadCreatedHandler.Interface {
    constructor(private createNotification: CreateNotificationUseCase.Interface) {}

    async handle(event: CollabThreadCreatedHandler.Event) {
        const { thread, message, anchor } = event.payload;
        const actor = message.createdBy;
        // Reference the entry itself (e.g. "mentioned you on <entry title>"), falling back to the
        // anchored field label only when the entry title is unavailable.
        const title = anchor.contentTitle || anchor.label || "a comment";
        const link = {
            app: APP_HEADLESS_CMS,
            contentType: thread.contentType,
            contentId: thread.contentId,
            locator: thread.locator,
            threadId: thread.id
        };

        const recipients = new Set((message.mentions || []).filter(id => id && id !== actor.id));

        for (const recipientId of recipients) {
            await this.createNotification.execute({
                recipientId,
                type: NotificationType.mention,
                actor,
                title,
                snippet: message.body,
                link
            });
        }
    }
}

export const ThreadCreatedNotificationHandler = CollabThreadCreatedHandler.createImplementation({
    implementation: ThreadCreatedNotificationHandlerImpl,
    dependencies: [CreateNotificationUseCase]
});
