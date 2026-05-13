import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ListWebhooksRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhookValues, IListWebhooksInput } from "~/api/domain/types.js";
import { CmsEntryToWebhook } from "~/api/domain/CmsEntryToWebhook.js";

class ListWebhooksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface
    ) {}

    async execute(
        input?: IListWebhooksInput
    ): Promise<Result<RepositoryAbstraction.Output, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
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

            const listResult = await this.listEntriesRepository.execute<IWebhookValues>(
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
                items: entries.map(entry => CmsEntryToWebhook.map(entry)),
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
    dependencies: [GetModelRepository, ListEntriesRepository]
});
