import { CollabReplyAddedHandler } from "@webiny/api-collaboration/domain/thread/events.js";
import { CreateNotificationUseCase } from "@webiny/api-notifications/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/api-notifications/domain/notification/abstractions.js";
import { APP_HEADLESS_CMS } from "~/constants.js";

/**
 * A reply -> notify the thread participants (authors of earlier messages) and anyone mentioned
 * in the reply. Mentioned recipients get a `mention` notification; other participants get a
 * `reply` notification. The reply's author is never notified.
 */
class ReplyAddedNotificationHandlerImpl implements CollabReplyAddedHandler.Interface {
    constructor(private createNotification: CreateNotificationUseCase.Interface) {}

    async handle(event: CollabReplyAddedHandler.Event) {
        const { thread, message, anchor } = event.payload;
        const actor = message.createdBy;
        // Reference the entry itself (e.g. "replied to your comment on <entry title>"), falling
        // back to the anchored field label only when the entry title is unavailable.
        const title = anchor.contentTitle || anchor.label || "a comment";
        const link = {
            app: APP_HEADLESS_CMS,
            contentType: thread.contentType,
            contentId: thread.contentId,
            locator: thread.locator,
            threadId: thread.id
        };

        const mentioned = new Set((message.mentions || []).filter(id => id && id !== actor.id));
        const participants = new Set<string>();

        for (const existing of thread.messages) {
            if (existing.id === message.id || existing.deleted) {
                continue;
            }
            const authorId = existing.createdBy?.id;
            if (authorId && authorId !== actor.id && !mentioned.has(authorId)) {
                participants.add(authorId);
            }
        }

        for (const recipientId of mentioned) {
            await this.createNotification.execute({
                recipientId,
                type: NotificationType.mention,
                actor,
                title,
                snippet: message.body,
                link
            });
        }

        for (const recipientId of participants) {
            await this.createNotification.execute({
                recipientId,
                type: NotificationType.reply,
                actor,
                title,
                snippet: message.body,
                link
            });
        }
    }
}

export const ReplyAddedNotificationHandler = CollabReplyAddedHandler.createImplementation({
    implementation: ReplyAddedNotificationHandlerImpl,
    dependencies: [CreateNotificationUseCase]
});
