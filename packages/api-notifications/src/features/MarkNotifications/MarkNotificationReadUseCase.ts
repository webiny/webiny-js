import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { MarkNotificationReadUseCase as UseCase } from "./abstractions.js";
import { NotificationRepository } from "~/domain/notification/abstractions.js";
import { NotificationNotAuthorizedError } from "~/domain/notification/errors.js";

class MarkNotificationReadUseCaseImpl implements UseCase.Interface {
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

        if (notification.read) {
            return Result.ok(notification);
        }

        notification.read = true;
        notification.readOn = new Date().toISOString();

        return this.repository.save(notification);
    }
}

export const MarkNotificationReadUseCase = UseCase.createImplementation({
    implementation: MarkNotificationReadUseCaseImpl,
    dependencies: [NotificationRepository, IdentityContext]
});
