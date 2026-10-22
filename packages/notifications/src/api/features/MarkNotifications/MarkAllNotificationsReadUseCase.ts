import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { MarkAllNotificationsReadUseCase as UseCase } from "./abstractions.js";
import { ListNotificationsRepository } from "~/api/features/ListNotifications/index.js";
import { UpdateNotificationRepository } from "~/api/features/UpdateNotification/index.js";

class MarkAllNotificationsReadUseCaseImpl implements UseCase.Interface {
    constructor(
        private listNotifications: ListNotificationsRepository.Interface,
        private updateNotification: UpdateNotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute() {
        const recipientId = this.identityContext.getIdentity().id;
        const now = new Date().toISOString();
        let updated = 0;
        let after: string | null = null;

        do {
            const listResult = await this.listNotifications.execute({
                where: { recipientId, archived: false, read: false },
                limit: 200,
                after
            });
            if (listResult.isFail()) {
                return Result.fail(listResult.error);
            }

            for (const notification of listResult.value.items) {
                notification.read = true;
                notification.readOn = now;
                const saveResult = await this.updateNotification.execute(notification);
                if (saveResult.isFail()) {
                    return Result.fail(saveResult.error);
                }
                updated++;
            }

            after = listResult.value.meta.cursor;
        } while (after);

        return Result.ok(updated);
    }
}

export const MarkAllNotificationsReadUseCase = UseCase.createImplementation({
    implementation: MarkAllNotificationsReadUseCaseImpl,
    dependencies: [ListNotificationsRepository, UpdateNotificationRepository, IdentityContext]
});
