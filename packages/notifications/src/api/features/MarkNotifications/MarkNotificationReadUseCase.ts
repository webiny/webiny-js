import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { MarkNotificationReadUseCase as UseCase } from "./abstractions.js";
import { GetNotificationRepository } from "~/api/features/GetNotification/index.js";
import { UpdateNotificationRepository } from "~/api/features/UpdateNotification/index.js";
import { NotificationNotAuthorizedError } from "~/api/domain/notification/errors.js";

class MarkNotificationReadUseCaseImpl implements UseCase.Interface {
    constructor(
        private getNotification: GetNotificationRepository.Interface,
        private updateNotification: UpdateNotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(id: string) {
        const result = await this.getNotification.execute(id);
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

        return this.updateNotification.execute(notification);
    }
}

export const MarkNotificationReadUseCase = UseCase.createImplementation({
    implementation: MarkNotificationReadUseCaseImpl,
    dependencies: [GetNotificationRepository, UpdateNotificationRepository, IdentityContext]
});
