import { Result } from "@webiny/feature/api";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    NotificationMapper,
    type INotificationListParams,
    type INotificationValues,
    type INotificationWhere
} from "~/api/domain/notification/abstractions.js";
import { NotificationPersistenceError } from "~/api/domain/notification/errors.js";
import { NOTIFICATION_MODEL_ID } from "~/shared/constants.js";
import { ListNotificationsRepository as Repository } from "./abstractions.js";

const SORT = ["createdOn_DESC"] as (`${string}_ASC` | `${string}_DESC`)[];

class ListNotificationsRepositoryImpl implements Repository.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private getModel: GetModelUseCase.Interface,
        private mapper: NotificationMapper.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(params: INotificationListParams): Repository.Return {
        const modelResult = await this.getModel.execute(NOTIFICATION_MODEL_ID);
        if (modelResult.isFail()) {
            return Result.fail(new NotificationPersistenceError(modelResult.error));
        }

        const model = modelResult.value;

        const where = this.cmsWhereMapper.map({
            input: buildWhere(params.where),
            fields: model.fields
        });

        const result = await this.identityContext.withoutAuthorization(() =>
            this.listLatestEntries.execute<INotificationValues>(model, {
                sort: SORT,
                limit: params.limit ?? 50,
                after: params.after ?? undefined,
                where
            })
        );

        if (result.isFail()) {
            return Result.fail(new NotificationPersistenceError(result.error));
        }

        return Result.ok({
            items: result.value.entries.map(entry => this.mapper.fromCmsEntry(entry)),
            meta: result.value.meta
        });
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

export const ListNotificationsRepository = Repository.createImplementation({
    implementation: ListNotificationsRepositoryImpl,
    dependencies: [
        ListLatestEntriesUseCase,
        GetModelUseCase,
        NotificationMapper,
        CmsWhereMapper,
        IdentityContext
    ]
});
