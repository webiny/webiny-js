import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import {
    WebsocketsSendToConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";
import { FakeWebsocketFailure } from "./FakeWebsocketFailure.js";
import type { WebsocketFakeMode } from "./FakeWebsocketConnections.js";

/** One `execute` call: the connections it was given and the whole `{ action, data }` message. */
export interface SentFrame {
    connections: WebsocketsSendToConnectionsUseCase.Connection[];
    message: WebsocketsSendToConnectionsUseCase.Data<GenericRecord>;
}

/**
 * `WebsocketsSendToConnectionsUseCase` that records every call instead of sending a frame (a
 * failing or throwing call is recorded too). `mode` makes the calls fail or throw (all, or only
 * the ones whose first connection id is `onlyFor`); `holdMs` keeps a call in flight so a test can
 * measure concurrency. Register with
 * `container.registerInstance(WebsocketsSendToConnectionsUseCase, fake)`.
 */
export class RecordingWebsocketsSend implements WebsocketsSendToConnectionsUseCase.Interface {
    public readonly sent: SentFrame[] = [];
    public mode: WebsocketFakeMode = "ok";
    /** When set, `mode` applies only to the sends whose first connection id is this one. */
    public onlyFor: string | null = null;
    public failureMessage = "The websocket send failed.";
    public holdMs = 0;
    public inFlight = 0;
    public maxInFlight = 0;

    public async execute<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsSendToConnectionsUseCase.Connection[],
        data: WebsocketsSendToConnectionsUseCase.Data<T>
    ): Promise<Result<void, WebsocketsError>> {
        this.sent.push({
            connections: structuredClone(connections),
            message: structuredClone(data) as WebsocketsSendToConnectionsUseCase.Data<GenericRecord>
        });
        this.inFlight += 1;
        this.maxInFlight = Math.max(this.maxInFlight, this.inFlight);
        try {
            if (this.holdMs > 0) {
                await new Promise<void>(resolve => setTimeout(resolve, this.holdMs));
            }
            const applies = this.onlyFor === null || this.onlyFor === connections[0]?.connectionId;
            if (applies && this.mode === "throw") {
                throw new Error(this.failureMessage);
            }
            if (applies && this.mode === "fail") {
                return Result.fail(new FakeWebsocketFailure(this.failureMessage) as never);
            }
            return Result.ok();
        } finally {
            this.inFlight -= 1;
        }
    }
}
