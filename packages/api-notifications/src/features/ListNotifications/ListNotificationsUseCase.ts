import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListNotificationsUseCase as UseCase } from "./abstractions.js";
import { NotificationRepository } from "~/domain/notification/abstractions.js";

class ListNotificationsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: NotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(params: UseCase.Params) {
        const recipientId = this.identityContext.getIdentity().id;

        return this.repository.list({
            where: {
                recipientId,
                archived: params.archived,
                read: params.read
            },
            limit: params.limit,
            after: params.after
        });
    }
}

export const ListNotificationsUseCase = UseCase.createImplementation({
    implementation: ListNotificationsUseCaseImpl,
    dependencies: [NotificationRepository, IdentityContext]
});
