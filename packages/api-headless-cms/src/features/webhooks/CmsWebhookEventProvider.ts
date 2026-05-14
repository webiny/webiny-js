import { WebhookEventProvider as WebhookEventProviderAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/abstractions.js";

const ACTIONS = ["created", "updated", "deleted", "published", "unpublished"] as const;

class CmsWebhookEventProviderImpl implements WebhookEventProviderAbstraction.Interface {
    constructor(private listModels: ListModelsUseCase.Interface) {}

    async getAvailableEvents(): Promise<WebhookEventProviderAbstraction.Definition[]> {
        const result = await this.listModels.execute({ includePrivate: false });
        if (result.isFail()) {
            return [];
        }

        return result.value.reduce<WebhookEventProviderAbstraction.Definition[]>(
            (events, model) => {
                if (model.tags?.includes("$hidden:true")) {
                    return events;
                }

                for (const action of ACTIONS) {
                    events.push({
                        app: "cms",
                        modelId: model.modelId,
                        eventName: `cms.entry.${model.modelId}.${action}`,
                        label: `${model.name}: Entry ${action.charAt(0).toUpperCase() + action.slice(1)}`
                    });
                }
                return events;
            },
            []
        );
    }
}

export const WebhookEventProvider = WebhookEventProviderAbstraction.createImplementation({
    implementation: CmsWebhookEventProviderImpl,
    dependencies: [ListModelsUseCase]
});
