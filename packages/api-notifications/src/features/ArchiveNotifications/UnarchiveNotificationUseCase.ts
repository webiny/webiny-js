import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UnarchiveNotificationUseCase as UseCase } from "./abstractions.js";
import { NotificationRepository } from "~/domain/notification/abstractions.js";
import { NotificationNotAuthorizedError } from "~/domain/notification/errors.js";

class UnarchiveNotificationUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: NotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(id: string) {
        const result = await this.repository.getById(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const notification = result.value;
        if (notification.recipientId !== this.identityContext.getIdentity().id) {
            return Result.fail(new NotificationNotAuthorizedError());
        }

        notification.archived = false;
        notification.archivedOn = null;

        return this.repository.save(notification);
    }
}

export const UnarchiveNotificationUseCase = UseCase.createImplementation({
    implementation: UnarchiveNotificationUseCaseImpl,
    dependencies: [NotificationRepository, IdentityContext]
});
