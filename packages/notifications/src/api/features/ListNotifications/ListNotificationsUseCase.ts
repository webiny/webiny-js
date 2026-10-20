import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    ListNotificationsRepository,
    ListNotificationsUseCase as UseCase
} from "./abstractions.js";

class ListNotificationsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ListNotificationsRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(params: UseCase.Params) {
        const recipientId = this.identityContext.getIdentity().id;

        return this.repository.execute({
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
    dependencies: [ListNotificationsRepository, IdentityContext]
});
