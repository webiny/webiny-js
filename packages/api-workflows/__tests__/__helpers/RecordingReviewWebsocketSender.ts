import { ReviewWebsocketSender } from "~/features/notifications/ReviewWebsocketSender/index.js";

/**
 * Stands in for the sender in the notifier tests: records every `send` call (cloned), and with
 * `mode: "throw"` rejects, which the real sender never does, to prove a caller survives it.
 * Register with `container.registerInstance(ReviewWebsocketSender, sender)`.
 */
export class RecordingReviewWebsocketSender implements ReviewWebsocketSender.Interface {
    public readonly calls: ReviewWebsocketSender.SendParams[] = [];
    public mode: "ok" | "throw" = "ok";

    public async send(params: ReviewWebsocketSender.SendParams): Promise<void> {
        this.calls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The sender crashed.");
        }
    }
}
