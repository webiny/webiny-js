import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListWebhooksRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhookValues, IListWebhooksInput } from "~/api/domain/types.js";

class ListWebhooksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface
    ) {}

    async execute(
        input?: IListWebhooksInput
    ): Promise<Result<RepositoryAbstraction.Output, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const valuesWhere: Record<string, string | boolean | string[]> = {};
            if (input?.where?.enabled !== undefined) {
                valuesWhere.enabled = input.where.enabled;
            }
            if (input?.where?.events) {
                valuesWhere.events_in = [input.where.events];
            }

            const listResult = await this.listEntriesUseCase.execute<IWebhookValues>(
                modelResult.value,
                {
                    where: { values: valuesWhere },
                    limit: input?.limit ?? 100,
                    after: input?.after
                }
            );

            if (listResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(listResult.error as any));
            }

            const { entries, meta } = listResult.value;
            return Result.ok({
                items: entries.map(entry => ({
                    id: entry.entryId,
                    values: entry.values,
                    createdOn: entry.createdOn,
                    modifiedOn: entry.savedOn
                })),
                meta: {
                    cursor: meta.cursor,
                    hasMoreItems: meta.hasMoreItems,
                    totalCount: meta.totalCount
                }
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const ListWebhooksRepository = RepositoryAbstraction.createImplementation({
    implementation: ListWebhooksRepositoryImpl,
    dependencies: [GetModelUseCase, ListEntriesUseCase]
});
