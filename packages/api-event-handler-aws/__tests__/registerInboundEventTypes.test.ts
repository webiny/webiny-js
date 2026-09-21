/**
 * Guards the inbound transport wiring of the AWS Lambda handler.
 *
 * Dispatch starts by finding an event type that recognises the incoming payload. When none matches,
 * `HandlerApp` throws "No event type matched the incoming event" and the invocation fails — and
 * because these invokers retry silently in the background, nothing surfaces in the product. Two
 * bugs of exactly this shape have shipped: WebSockets ($connect never dispatched, so server→client
 * push was dead) and EventBridge Scheduler (schedules were created and fired on time, but the
 * Lambda rejected the event, so scheduled publishing silently never happened).
 *
 * The per-transport unit tests can't catch this. They register the handler themselves as the unit
 * under test, so they pass while the production composition root never wires it.
 *
 * NOT asserted here: that each matched event type also has a HANDLER registered (an event type
 * without one resolves an empty chain and does nothing). Registering a handler and resolving its
 * abstraction through a package path yields two different Symbol tokens in this test setup, so the
 * assertion would read 0 either way. Worth adding once that duplicate-abstraction issue is fixed.
 */
import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { EventType } from "@webiny/event-handler-core";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/event-handler-aws/eventTypes/ScheduledActionEventType.js";
import { registerInboundEventTypes } from "~/composition/registerInboundEventTypes.js";

/** One representative payload per inbound transport, shaped as the real invoker sends it. */
const EVENTS: Array<{ transport: string; event: Record<string, any> }> = [
    {
        transport: "EventBridge Scheduler (scheduled publish/unpublish)",
        event: {
            [SCHEDULED_ACTION_EVENT_IDENTIFIER]: {
                id: "wby-schedule-24bc00f9ab7788c7cd094e5a",
                namespace: "Cms/Entry/product",
                scheduleFor: "2026-09-07T10:34:00.000Z",
                tenant: "root"
            }
        }
    },
    {
        transport: "API Gateway WebSocket",
        event: {
            requestContext: { routeKey: "$connect", connectionId: "abc123", eventType: "CONNECT" }
        }
    },
    {
        transport: "Step Functions background task",
        // The SFN transport wraps the task as `{ name, payload }`; the event type unwraps `payload`.
        event: {
            name: "background-task",
            payload: {
                webinyTaskId: "6a9dcb3ebb9152000289ef8e",
                webinyTaskDefinitionId: "hcmsBulkListEntries",
                tenant: "root"
            }
        }
    }
];

describe("AWS handler inbound event types", () => {
    it.each(EVENTS)("matches exactly one event type for $transport", ({ event }) => {
        const container = new Container();
        registerInboundEventTypes(container);

        const matched = container
            .resolveAll(EventType)
            .filter(eventType => eventType.canHandle(event));

        expect(matched).toHaveLength(1);
    });
});
