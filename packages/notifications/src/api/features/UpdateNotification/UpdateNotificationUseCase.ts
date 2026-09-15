import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    UpdateNotificationRepository,
    UpdateNotificationUseCase as UseCase
} from "./abstractions.js";
import { NotificationNotAuthorizedError } from "~/api/domain/notification/errors.js";
import type { INotification } from "~/api/domain/notification/abstractions.js";

class UpdateNotificationUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: UpdateNotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(notification: INotification): UseCase.Return {
        if (notification.recipientId !== this.identityContext.getIdentity().id) {
            return Result.fail(new NotificationNotAuthorizedError());
        }

        return this.repository.execute(notification);
    }
}

export const UpdateNotificationUseCase = UseCase.createImplementation({
    implementation: UpdateNotificationUseCaseImpl,
    dependencies: [UpdateNotificationRepository, IdentityContext]
});
