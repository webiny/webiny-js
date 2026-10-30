import { ReviewChangeNotifierService } from "~/features/notifications/ReviewChangeNotifierService/index.js";

/**
 * Stands in for the change notifier in the handler tests: records every `notify` call (cloned),
 * and with `mode: "throw"` rejects, which the real service never does, to prove a handler
 * survives it. Register with `container.registerInstance(ReviewChangeNotifierService, notifier)`.
 */
export class RecordingReviewChangeNotifier implements ReviewChangeNotifierService.Interface {
    public readonly calls: ReviewChangeNotifierService.Params[] = [];
    public mode: "ok" | "throw" = "ok";

    public async notify(params: ReviewChangeNotifierService.Params): Promise<void> {
        this.calls.push(structuredClone(params));
        if (this.mode === "throw") {
            throw new Error("The change notifier crashed.");
        }
    }
}
