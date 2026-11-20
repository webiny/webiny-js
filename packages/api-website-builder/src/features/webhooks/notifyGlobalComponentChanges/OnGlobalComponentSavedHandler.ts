import { GlobalComponentAfterSaveEventHandler } from "~/features/globals/SaveGlobalComponent/abstractions.js";
import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { WebhookEvent } from "~/features/webhooks/constants.js";

class OnGlobalComponentSavedHandlerImpl implements GlobalComponentAfterSaveEventHandler.Interface {
    constructor(private dispatcher: WebhookDispatcher.Interface) {}

    public async handle(event: GlobalComponentAfterSaveEventHandler.Event): Promise<void> {
        await this.dispatcher.dispatch(WebhookEvent.WbGlobalComponentSaved, {
            globalComponent: event.payload.globalComponent
        });
    }
}

export const OnGlobalComponentSavedHandler =
    GlobalComponentAfterSaveEventHandler.createImplementation({
        implementation: OnGlobalComponentSavedHandlerImpl,
        dependencies: [WebhookDispatcher]
    });
