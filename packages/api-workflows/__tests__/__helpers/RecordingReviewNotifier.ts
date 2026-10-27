import { ReviewNotifierService } from "~/features/notifications/ReviewNotifierService/index.js";

/**
 * Stands in for the notifier in the handler tests: records every `notify` call (cloned), and with
 * `mode: "throw"` rejects, which the real notifier never does, to prove a handler survives it.
 * Register with `container.registerInstance(ReviewNotifierService, notifier)`.
 */
export class RecordingReviewNotifier implements ReviewNotifierService.Interface {
    public readonly calls: ReviewNotifierService.Params[] = [];
    public mode: "ok" | "throw" = "ok";

    public async notify(params: ReviewNotifierService.Params): Promise<void> {
        this.calls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The notifier crashed.");
        }
    }
}
