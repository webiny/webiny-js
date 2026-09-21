import type { Container } from "@webiny/di";
import {
    BackgroundTaskEventType,
    EventBridgeEventType,
    ScheduledActionEventType,
    WebSocketEventType
} from "@webiny/event-handler-aws";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { BulkActionsEventBridgeLambdaHandlerFeature } from "@webiny/api-headless-cms-bulk-actions-aws";
import { ScheduledActionLambdaHandler } from "@webiny/api-scheduler";

/**
 * Registers every NON-HTTP way this Lambda can be invoked: the event type that recognises the
 * payload shape, plus the handler the dispatcher resolves once it matches. (The HTTP transport is
 * registered by `ApiGatewayFeature`, which also brings the router.)
 *
 * Both halves are required. An event type with no handler resolves to an empty handler chain and
 * the invocation silently does nothing; a handler with no event type fails the dispatch outright
 * with "No event type matched the incoming event".
 *
 * This lives in one function so the set is testable, and so an inbound transport cannot be
 * half-wired. Two bugs of exactly that shape have already shipped: WebSockets ($connect never
 * dispatched, so server→client push was dead) and EventBridge Scheduler (schedules were created
 * and fired, but the invocation was rejected, so scheduled publishing silently never happened).
 */
export function registerInboundEventTypes(container: Container): void {
    // Background task invocations (Step Functions → Lambda directly). BackgroundTasksAwsFeature
    // registers the Lambda handler + StepFunctionService (the AWS dispatch transport).
    container.register(BackgroundTaskEventType);
    BackgroundTasksAwsFeature.register(container);

    // EventBridge invocations (e.g. scheduled empty-trash-bin).
    container.register(EventBridgeEventType);
    BulkActionsEventBridgeLambdaHandlerFeature.register(container);

    // EventBridge Scheduler invocations (a scheduled publish/unpublish firing). SchedulerAwsFeature
    // wires only the OUTBOUND side (creating the schedule), so the inbound half belongs here.
    container.register(ScheduledActionEventType);
    container.register(ScheduledActionLambdaHandler);

    // API Gateway WebSocket invocations ($connect/$disconnect/$default). The connection handlers
    // come from WebsocketsFeature in the per-request stack.
    container.register(WebSocketEventType);
}
