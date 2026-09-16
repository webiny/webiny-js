import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    NotificationMapper,
    type INotificationValues
} from "~/api/domain/notification/abstractions.js";
import {
    NotificationNotFoundError,
    NotificationPersistenceError
} from "~/api/domain/notification/errors.js";
import { NOTIFICATION_MODEL_ID } from "~/shared/constants.js";
import { GetNotificationRepository as Repository } from "./abstractions.js";

class GetNotificationRepositoryImpl implements Repository.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private mapper: NotificationMapper.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(id: string): Repository.Return {
        const modelResult = await this.getModel.execute(NOTIFICATION_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new NotificationPersistenceError(modelResult.error));
        }

        const revisionId = createIdentifier({ id, version: 1 });

        const result = await this.identityContext.withoutAuthorization(() =>
            this.getEntryById.execute<INotificationValues>(modelResult.value, revisionId)
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new NotificationNotFoundError({ id }));
            }
            return Result.fail(new NotificationPersistenceError(result.error));
        }

        return Result.ok(this.mapper.fromCmsEntry(result.value));
    }
}

export const GetNotificationRepository = Repository.createImplementation({
    implementation: GetNotificationRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, GetModelUseCase, NotificationMapper, IdentityContext]
});
