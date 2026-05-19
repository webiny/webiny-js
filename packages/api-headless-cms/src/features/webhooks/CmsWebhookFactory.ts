import { WebhookFactory as WebhookFactoryAbstraction } from "@webiny/api-core/features/webhooks/index.js";
import { ListModelsUseCase } from "~/features/contentModel/ListModels/abstractions.js";

const ACTIONS = ["created", "updated", "deleted", "published", "unpublished"] as const;

class CmsWebhookFactoryImpl implements WebhookFactoryAbstraction.Interface {
    constructor(private listModels: ListModelsUseCase.Interface) {}

    public async execute(): Promise<WebhookFactoryAbstraction.Definition[]> {
        const result = await this.listModels.execute({
            includePrivate: false
        });
        if (result.isFail()) {
            return [];
        }

        return result.value.reduce<WebhookFactoryAbstraction.Definition[]>((events, model) => {
            if (model.tags?.includes("$hidden:true")) {
                return events;
            }

            for (const action of ACTIONS) {
                events.push({
                    app: "cms",
                    appLabel: "Headless CMS",
                    entity: model.modelId,
                    eventName: `cms.entry.${model.modelId}.${action}`,
                    label: `${model.name}: Entry ${action.charAt(0).toUpperCase() + action.slice(1)}`
                });
            }
            return events;
        }, []);
    }
}

export const CmsWebhookFactory = WebhookFactoryAbstraction.createImplementation({
    implementation: CmsWebhookFactoryImpl,
    dependencies: [ListModelsUseCase]
});
