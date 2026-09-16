import { Result } from "@webiny/feature/api";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    type INotificationValues,
    type INotificationWhere
} from "~/api/domain/notification/abstractions.js";
import { NotificationPersistenceError } from "~/api/domain/notification/errors.js";
import { NOTIFICATION_MODEL_ID } from "~/shared/constants.js";
import { CountNotificationsRepository as Repository } from "./abstractions.js";

class CountNotificationsRepositoryImpl implements Repository.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(where: INotificationWhere): Repository.Return {
        const modelResult = await this.getModel.execute(NOTIFICATION_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new NotificationPersistenceError(modelResult.error));
        }

        const model = modelResult.value;

        const mapped = this.cmsWhereMapper.map({
            input: buildWhere(where),
            fields: model.fields
        });

        const result = await this.identityContext.withoutAuthorization(() =>
            this.listLatestEntries.execute<INotificationValues>(model, {
                limit: 1,
                where: mapped
            })
        );

        if (result.isFail()) {
            return Result.fail(new NotificationPersistenceError(result.error));
        }

        return Result.ok(result.value.meta.totalCount);
    }
}

function buildWhere(where: INotificationWhere): Record<string, unknown> {
    const input: Record<string, unknown> = { recipientId: where.recipientId };
    if (typeof where.archived === "boolean") {
        input.archived = where.archived;
    }
    if (typeof where.read === "boolean") {
        input.read = where.read;
    }
    return input;
}

export const CountNotificationsRepository = Repository.createImplementation({
    implementation: CountNotificationsRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, GetModelUseCase, CmsWhereMapper, IdentityContext]
});
