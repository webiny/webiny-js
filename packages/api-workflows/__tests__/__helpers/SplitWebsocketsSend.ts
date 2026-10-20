import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import {
    WebsocketsSendToConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";
import { WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION } from "~/domain/notifications/constants.js";
import { RecordingWebsocketsSend, type SentFrame } from "./RecordingWebsocketsSend.js";

/**
 * `RecordingWebsocketsSend` that keeps the silent `workflows.reviewChanged` frames apart: `sent`
 * holds the notification frames only (so the phase 7 assertions on `sent` stay true) and `changes`
 * holds the change frames. A change frame is always answered with `Result.ok()`: `mode`, `onlyFor`
 * and `holdMs` apply to the notification frames. Register with
 * `container.registerInstance(WebsocketsSendToConnectionsUseCase, fake)`.
 */
export class SplitWebsocketsSend extends RecordingWebsocketsSend {
    public readonly changes: SentFrame[] = [];

    public override async execute<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsSendToConnectionsUseCase.Connection[],
        data: WebsocketsSendToConnectionsUseCase.Data<T>
    ): Promise<Result<void, WebsocketsError>> {
        if (data.action !== WORKFLOWS_REVIEW_CHANGED_WEBSOCKET_ACTION) {
            return super.execute(connections, data);
        }

        const message: WebsocketsSendToConnectionsUseCase.Data<GenericRecord> =
            structuredClone(data);
        this.changes.push({ connections: structuredClone(connections), message });
        return Result.ok();
    }
}
