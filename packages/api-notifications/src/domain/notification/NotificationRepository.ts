import { Result } from "@webiny/feature/api";
import { createIdentifier, mdbid } from "@webiny/utils";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    NotificationMapper,
    NotificationModel,
    NotificationRepository as RepositoryAbstraction,
    type INotification,
    type INotificationValues,
    type INotificationWhere
} from "./abstractions.js";
import { NotificationNotFoundError, NotificationPersistenceError } from "./errors.js";

const SORT = ["createdOn_DESC"] as (`${string}_ASC` | `${string}_DESC`)[];

class NotificationRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private model: NotificationModel.Interface,
        private mapper: NotificationMapper.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async create(values: INotificationValues) {
        try {
            const created = await this.identityContext.withoutAuthorization(() =>
                this.createEntry.execute<INotificationValues>(this.model, {
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

    async list(params: RepositoryAbstraction.ListParams) {
        const where = this.cmsWhereMapper.map({
            input: this.buildWhere(params.where),
            fields: this.model.fields
        });

        const result = await this.identityContext.withoutAuthorization(() =>
            this.listLatestEntries.execute<INotificationValues>(this.model, {
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

    async count(where: INotificationWhere) {
        const mapped = this.cmsWhereMapper.map({
            input: this.buildWhere(where),
            fields: this.model.fields
        });

        const result = await this.identityContext.withoutAuthorization(() =>
            this.listLatestEntries.execute<INotificationValues>(this.model, {
                limit: 1,
                where: mapped
            })
        );

        if (result.isFail()) {
            return Result.fail(new NotificationPersistenceError(result.error));
        }

        return Result.ok(result.value.meta.totalCount);
    }

    async getById(id: string) {
        const revisionId = createIdentifier({ id, version: 1 });

        const result = await this.identityContext.withoutAuthorization(() =>
            this.getEntryById.execute<INotificationValues>(this.model, revisionId)
        );

        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new NotificationNotFoundError({ id }));
            }
            return Result.fail(new NotificationPersistenceError(result.error));
        }

        return Result.ok(this.mapper.fromCmsEntry(result.value));
    }

    async save(notification: INotification) {
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
                this.updateEntry.execute<INotificationValues>(this.model, revisionId, { values })
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

    private buildWhere(where: INotificationWhere): Record<string, unknown> {
        const input: Record<string, unknown> = { recipientId: where.recipientId };
        if (typeof where.archived === "boolean") {
            input.archived = where.archived;
        }
        if (typeof where.read === "boolean") {
            input.read = where.read;
        }
        return input;
    }
}

export const NotificationRepository = RepositoryAbstraction.createImplementation({
    implementation: NotificationRepositoryImpl,
    dependencies: [
        CreateEntryUseCase,
        ListLatestEntriesUseCase,
        GetEntryByIdUseCase,
        UpdateEntryUseCase,
        NotificationModel,
        NotificationMapper,
        CmsWhereMapper,
        IdentityContext
    ]
});
