import { createFeature } from "@webiny/feature/api";
import { registerSchedulerServerExtension } from "./context.js";

/**
 * Self-hosted (Bree, in-process) scheduler transport. Wraps `registerSchedulerServerExtension` so the
 * handler's `transports` wiring reads uniformly (`SchedulerServerFeature.register(c)`), matching the
 * other transport adapters.
 */
export const SchedulerServerFeature = createFeature({
    name: "SchedulerServer",
    register(container) {
        registerSchedulerServerExtension(container);
    }
});
