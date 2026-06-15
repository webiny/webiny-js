import type { Container } from "@webiny/di";
import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeEventHandler,
    type EventBridgeResult
} from "@webiny/event-handler-aws/abstractions/handlers/EventBridgeEventHandler.js";
import { GraphQLContextEnhancer } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { HcmsBulkActionsContext } from "~/types.js";

const DETAIL_TYPE = "WebinyEmptyTrashBin";

class BulkActionsEventBridgeLambdaHandlerImpl implements EventBridgeEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<EventBridgeEvent<string, any>>,
        _next: NextFunction
    ): Promise<EventBridgeResult> {
        if (eventCtx.event["detail-type"] !== DETAIL_TYPE) {
            return { success: true, message: "Not a bulk action event." };
        }

        const ctx: Record<string, any> = { container: this.container };
        for (const enhancer of this.container.resolveAll(GraphQLContextEnhancer)) {
            await enhancer.enhance(ctx);
        }

        const context = ctx as HcmsBulkActionsContext;

        if (!context.tasks || !context.tenancy) {
            console.error("Missing tasks or tenancy definition on context.");
            return { success: false, message: "Missing tasks or tenancy." };
        }

        await context.tenancy.withRootTenant(async () => {
            await context.tasks.trigger({ definition: "hcmsEntriesEmptyTrashBins" });
        });

        return { success: true };
    }
}

export const BulkActionsEventBridgeLambdaHandler = EventBridgeEventHandler.createImplementation({
    implementation: BulkActionsEventBridgeLambdaHandlerImpl,
    dependencies: [RequestContainer]
});
