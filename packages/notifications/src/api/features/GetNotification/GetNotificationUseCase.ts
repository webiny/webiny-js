import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetNotificationRepository, GetNotificationUseCase as UseCase } from "./abstractions.js";
import { NotificationNotAuthorizedError } from "~/api/domain/notification/errors.js";

class GetNotificationUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: GetNotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(id: string): UseCase.Return {
        const result = await this.repository.execute(id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const notification = result.value;
        if (notification.recipientId !== this.identityContext.getIdentity().id) {
            return Result.fail(new NotificationNotAuthorizedError());
        }

        return Result.ok(notification);
    }
}

export const GetNotificationUseCase = UseCase.createImplementation({
    implementation: GetNotificationUseCaseImpl,
    dependencies: [GetNotificationRepository, IdentityContext]
});
