import { WebsocketEventHandler } from "webiny/admin/websockets";
import { Notifications } from "webiny/admin";

const DISCOUNT_APPLIED_ACTION = "cms.product.discountApplied";

interface DiscountAppliedData {
    id: string;
    price: number;
    percent: number;
}

/**
 * Reacts to the `cms.product.discountApplied` websocket message emitted by the
 * ApplyDiscount bulk action (once per discounted product) and shows a toast.
 *
 * Registered via `createFeature` in this extension's `index.tsx`. The websockets runner
 * resolves every registered `WebsocketEventHandler` and calls `handle` for each incoming
 * message, so we filter by `action` here.
 */
class DiscountAppliedEventHandlerImpl implements WebsocketEventHandler.Interface {
    constructor(private notifications: Notifications.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        const payload = event.payload as { action?: string; data?: DiscountAppliedData };
        if (payload.action !== DISCOUNT_APPLIED_ACTION || !payload.data) {
            return;
        }

        const { price, percent } = payload.data;
        this.notifications.success({
            title: "Discount applied",
            description: `-${percent}% applied — new price ${price}.`
        });
    }
}

export const DiscountAppliedEventHandler = WebsocketEventHandler.createImplementation({
    implementation: DiscountAppliedEventHandlerImpl,
    dependencies: [Notifications]
});
