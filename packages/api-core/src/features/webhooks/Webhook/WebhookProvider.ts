import { WebhookProvider as WebhookProviderAbstraction } from "./abstractions/WebhookProvider.js";
import { WebhookFactory } from "./abstractions/WebhookFactory.js";

class WebhookProviderImpl implements WebhookProviderAbstraction.Interface {
    private cache: WebhookFactory.Definition[] | null = null;

    public constructor(private readonly webhookFactory: WebhookFactory.Interface[]) {}

    public async execute(): Promise<WebhookProviderAbstraction.Response> {
        if (this.cache !== null) {
            return this.cache;
        }
        this.cache = [];
        for (const factory of this.webhookFactory) {
            this.cache.push(...(await factory.execute()));
        }
        return this.cache;
    }
}

export const WebhookProvider = WebhookProviderAbstraction.createImplementation({
    implementation: WebhookProviderImpl,
    dependencies: [[WebhookFactory, { multiple: true }]]
});
