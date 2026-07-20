import { WebsocketEventHandler } from "webiny/admin/websockets";
import { Notifications } from "webiny/admin";

const AI_SUMMARY_GENERATED_ACTION = "cms.product.aiSummaryGenerated";

interface AiSummaryGeneratedData {
    id: string;
    name: string;
    aiSummary: string;
}

/**
 * Reacts to the `cms.product.aiSummaryGenerated` websocket message emitted by the
 * GenerateAiSummary bulk action (once per processed entry) and shows a toast.
 */
class AiSummaryGeneratedEventHandlerImpl implements WebsocketEventHandler.Interface {
    constructor(private notifications: Notifications.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const payload = event.payload as { action?: string; data?: AiSummaryGeneratedData };
        if (payload.action !== AI_SUMMARY_GENERATED_ACTION || !payload.data) {
            return;
        }

        const { name } = payload.data;
        this.notifications.success({
            title: "AI summary generated",
            description: name ? `Summary ready for "${name}".` : "Summary ready."
        });
    }
}

export const AiSummaryGeneratedEventHandler = WebsocketEventHandler.createImplementation({
    implementation: AiSummaryGeneratedEventHandlerImpl,
    dependencies: [Notifications]
});
