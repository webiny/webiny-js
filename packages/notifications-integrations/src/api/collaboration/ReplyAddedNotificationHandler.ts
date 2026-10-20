import { CollabReplyAddedHandler } from "@webiny/collaboration/api/domain/thread/events.js";
import { CreateNotificationUseCase } from "@webiny/notifications/api/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/notifications/api/domain/notification/abstractions.js";
import { APP_HEADLESS_CMS } from "~/shared/constants.js";

class ReplyAddedNotificationHandlerImpl implements CollabReplyAddedHandler.Interface {
    constructor(private createNotification: CreateNotificationUseCase.Interface) {}

    async handle(event: CollabReplyAddedHandler.Event) {
        const { thread, message, anchor } = event.payload;
        const actor = message.createdBy;
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
