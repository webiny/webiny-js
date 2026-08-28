import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotificationCountsUseCase as UseCase } from "./abstractions.js";
import { NotificationRepository } from "~/domain/notification/abstractions.js";

class NotificationCountsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: NotificationRepository.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute() {
        const recipientId = this.identityContext.getIdentity().id;

        const [inbox, archive, unread] = await Promise.all([
            this.repository.count({ recipientId, archived: false }),
            this.repository.count({ recipientId, archived: true }),
            this.repository.count({ recipientId, archived: false, read: false })
        ]);

        if (inbox.isFail()) {
            return Result.fail(inbox.error);
        }
        if (archive.isFail()) {
            return Result.fail(archive.error);
        }
        if (unread.isFail()) {
            return Result.fail(unread.error);
        }

        return Result.ok({
            inbox: inbox.value,
            archive: archive.value,
            unread: unread.value
        });
    }
}

export const NotificationCountsUseCase = UseCase.createImplementation({
    implementation: NotificationCountsUseCaseImpl,
    dependencies: [NotificationRepository, IdentityContext]
});
