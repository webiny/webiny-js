import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { WebhookTransformer } from "~/api/features/Transformers/abstractions/WebhookTransformer.js";
import { ListWebhooksRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { IListWebhooksInput } from "./abstractions.js";
import type { WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

class ListWebhooksRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface,
        private readonly transformer: WebhookTransformer.Interface
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
            if (input?.where?.slug) {
                valuesWhere.slug = input.where.slug;
            }
            if (input?.where?.enabled !== undefined) {
                valuesWhere.enabled = input.where.enabled;
            }
            if (input?.where?.events) {
                valuesWhere.events_in = [input.where.events];
            }

            const listResult = await this.listEntriesRepository.execute<WebhookCmsEntryValues>(
                modelResult.value,
                {
                    where: { values: valuesWhere },
                    limit: input?.limit ?? 100,
                    after: input?.after
                }
            );

            if (listResult.isFail()) {
                return Result.fail(WebhookPersistenceError.from(listResult.error));
            }

            const { entries, meta } = listResult.value;
            const items = entries.map(entry => this.transformer.fromStorage(entry));

            return Result.ok({
                items,
                meta: {
                    cursor: meta.cursor,
                    hasMoreItems: meta.hasMoreItems,
                    totalCount: meta.totalCount
                }
            });
        } catch (error) {
            return Result.fail(WebhookPersistenceError.from(error));
        }
    }
}

export const ListWebhooksRepository = RepositoryAbstraction.createImplementation({
    implementation: ListWebhooksRepositoryImpl,
    dependencies: [GetModelRepository, ListEntriesRepository, WebhookTransformer]
});
