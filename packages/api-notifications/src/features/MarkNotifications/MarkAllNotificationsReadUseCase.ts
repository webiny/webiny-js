import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { MarkAllNotificationsReadUseCase as UseCase } from "./abstractions.js";
import { NotificationRepository } from "~/domain/notification/abstractions.js";

class MarkAllNotificationsReadUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: NotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute() {
        const recipientId = this.identityContext.getIdentity().id;

        const listResult = await this.repository.list({
            where: { recipientId, archived: false, read: false },
            limit: 200
        });
        if (listResult.isFail()) {
            return Result.fail(listResult.error);
        }

        const now = new Date().toISOString();
        let updated = 0;

        for (const notification of listResult.value.items) {
            notification.read = true;
            notification.readOn = now;
            const saveResult = await this.repository.save(notification);
            if (saveResult.isFail()) {
                return Result.fail(saveResult.error);
            }
            updated++;
        }

        return Result.ok(updated);
    }
}

export const MarkAllNotificationsReadUseCase = UseCase.createImplementation({
    implementation: MarkAllNotificationsReadUseCaseImpl,
    dependencies: [NotificationRepository, IdentityContext]
});
