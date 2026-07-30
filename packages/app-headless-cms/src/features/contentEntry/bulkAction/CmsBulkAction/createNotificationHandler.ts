import { WebsocketEventHandler } from "@webiny/app-websockets";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import type { NotificationSpec } from "./abstractions.js";

/**
 * Generates a `WebsocketEventHandler` for a single `CmsBulkAction` notification entry. It
 * mirrors the hand-written `DiscountAppliedEventHandler` pattern: filter incoming websocket
 * messages by `payload.action`, build a `NotificationSpec` from `payload.data`, and surface
 * it through `Notifications`.
 */
export function createNotificationHandler(
    actionKey: string,
    build: (data: any) => NotificationSpec
) {
    class GeneratedNotificationHandler implements WebsocketEventHandler.Interface {
        constructor(readonly notifications: Notifications.Interface) {}

        async handle(event: WebsocketEventHandler.Event): Promise<void> {
            const payload = event.payload as { action?: string; data?: any };
            if (payload.action !== actionKey || !payload.data) {
                return;
            }

            const spec = build(payload.data);
            const input = { title: spec.title, description: spec.description };

            switch (spec.variant) {
                case "success":
                    this.notifications.success(input);
                    break;
                case "warning":
                case "danger":
                    this.notifications.warning(input);
                    break;
                default:
                    this.notifications.notify(input);
                    break;
            }
        }
    }

    return WebsocketEventHandler.createImplementation({
        implementation: GeneratedNotificationHandler,
        dependencies: [Notifications]
    });
}
