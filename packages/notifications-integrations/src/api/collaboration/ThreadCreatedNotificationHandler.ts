import { CollabThreadCreatedHandler } from "@webiny/collaboration/api/domain/thread/events.js";
import { CreateNotificationUseCase } from "@webiny/notifications/api/features/CreateNotification/index.js";
import { NotificationType } from "@webiny/notifications/api/domain/notification/abstractions.js";
import { APP_HEADLESS_CMS } from "~/shared/constants.js";

class ThreadCreatedNotificationHandlerImpl implements CollabThreadCreatedHandler.Interface {
    constructor(private createNotification: CreateNotificationUseCase.Interface) {}

    async handle(event: CollabThreadCreatedHandler.Event) {
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
