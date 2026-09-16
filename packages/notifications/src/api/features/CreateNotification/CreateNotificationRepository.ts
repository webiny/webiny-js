import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    NotificationMapper,
    type INotificationValues
} from "~/api/domain/notification/abstractions.js";
import { NotificationPersistenceError } from "~/api/domain/notification/errors.js";
import { NOTIFICATION_MODEL_ID } from "~/shared/constants.js";
import { CreateNotificationRepository as Repository } from "./abstractions.js";

class CreateNotificationRepositoryImpl implements Repository.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private mapper: NotificationMapper.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(values: INotificationValues): Repository.Return {
        try {
            const modelResult = await this.getModel.execute(NOTIFICATION_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new NotificationPersistenceError(modelResult.error));
            }

            const created = await this.identityContext.withoutAuthorization(() =>
                this.createEntry.execute<INotificationValues>(modelResult.value, {
                    id: mdbid(),
                    values
                })
            );
            if (created.isFail()) {
                return Result.fail(new NotificationPersistenceError(created.error));
            }
            return Result.ok(this.mapper.fromCmsEntry(created.value));
        } catch (error) {
            return Result.fail(new NotificationPersistenceError(error as Error));
        }
    }
}

export const CreateNotificationRepository = Repository.createImplementation({
    implementation: CreateNotificationRepositoryImpl,
    dependencies: [CreateEntryUseCase, GetModelUseCase, NotificationMapper, IdentityContext]
});
