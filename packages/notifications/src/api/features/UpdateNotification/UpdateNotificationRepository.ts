import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { INotification, INotificationValues } from "~/api/domain/notification/abstractions.js";
import {
    NotificationNotFoundError,
    NotificationPersistenceError
} from "~/api/domain/notification/errors.js";
import { NOTIFICATION_MODEL_ID } from "~/shared/constants.js";
import { UpdateNotificationRepository as Repository } from "./abstractions.js";

class UpdateNotificationRepositoryImpl implements Repository.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(notification: INotification): Repository.Return {
        const modelResult = await this.getModel.execute(NOTIFICATION_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new NotificationPersistenceError(modelResult.error));
        }

        const revisionId = createIdentifier({ id: notification.id, version: 1 });
        const values: INotificationValues = {
            recipientId: notification.recipientId,
            type: notification.type,
            actor: notification.actor,
            title: notification.title,
            snippet: notification.snippet ?? null,
            link: notification.link ?? null,
            read: notification.read,
            readOn: notification.readOn ?? null,
            archived: notification.archived,
            archivedOn: notification.archivedOn ?? null
        };

        try {
            const result = await this.identityContext.withoutAuthorization(() =>
                this.updateEntry.execute<INotificationValues>(modelResult.value, revisionId, {
                    values
                })
            );
            if (result.isFail()) {
                if (result.error.code === "Cms/Entry/NotFound") {
                    return Result.fail(new NotificationNotFoundError({ id: notification.id }));
                }
                return Result.fail(new NotificationPersistenceError(result.error));
            }
            return Result.ok(notification);
        } catch (error) {
            return Result.fail(new NotificationPersistenceError(error as Error));
        }
    }
}

export const UpdateNotificationRepository = Repository.createImplementation({
    implementation: UpdateNotificationRepositoryImpl,
    dependencies: [UpdateEntryUseCase, GetModelUseCase, IdentityContext]
});
