import { createFeature } from "@webiny/feature/api";
import { createSchedulerClient } from "@webiny/aws-sdk/client-scheduler/index.js";
import { registerSchedulerAwsExtension } from "./context.js";

/**
 * AWS (EventBridge Scheduler) transport. Wraps `registerSchedulerAwsExtension` with the default
 * scheduler client so the handler's `transports` wiring reads uniformly
 * (`SchedulerAwsFeature.register(c)`), matching the other transport adapters. Callers that need a
 * custom client can still use `registerSchedulerAwsExtension` directly.
 */
export const SchedulerAwsFeature = createFeature({
    name: "SchedulerAws",
    register(container) {
        registerSchedulerAwsExtension(container, {
            getClient: config => createSchedulerClient(config)
        });
    }
});
