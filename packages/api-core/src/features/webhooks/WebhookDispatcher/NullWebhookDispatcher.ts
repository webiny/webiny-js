import { WebhookDispatcher } from "./abstractions.js";

class NullWebhookDispatcherImpl implements WebhookDispatcher.Interface {
    async dispatch(): Promise<void> {
        // No-op: no WebhookDispatcher implementation registered.
    }
}

export const NullWebhookDispatcher = WebhookDispatcher.createImplementation({
    implementation: NullWebhookDispatcherImpl,
    dependencies: []
});
