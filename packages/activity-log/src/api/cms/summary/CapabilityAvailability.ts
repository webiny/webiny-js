import { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/api/features/Capabilities/index.js";
import { SummaryModelAvailability } from "./availability.js";
import { ACTIVITY_LOG_SUMMARY_CAPABILITY } from "./capability.js";

/**
 * Whether the summary capability resolves to a model.
 *
 * Cached for the life of the request container. `isAvailable` is called on the write path — inside
 * an entry save — and resolving the capability reads settings and decrypts a key, which is not work
 * to repeat per save. Settings changing mid-request is not a case worth serving.
 *
 * Deliberately synchronous at the call site, because the routing rule is a pure function and the
 * alternative would make every caller of it async for a value that changes once per deployment.
 * The resolve therefore happens on first use and the answer is remembered, with `undefined`
 * meaning "not yet asked".
 */
class CapabilityAvailabilityImpl implements SummaryModelAvailability.Interface {
    private answer: boolean | undefined;

    constructor(private resolveCapability?: ResolveAiCapabilityUseCase.Interface) {
        // Warmed eagerly and ignored: the promise settles long before the first entry save in this
        // request, and a floating rejection is impossible because `execute` returns a Result.
        void this.warm();
    }

    isAvailable(): boolean {
        // Unknown means the warm-up has not settled. Answering false is the safe direction: the
        // save gets a deterministic description and records `ai-unavailable`, rather than a job
        // being dispatched against a capability that may not resolve.
        return this.answer === true;
    }

    private async warm(): Promise<void> {
        if (!this.resolveCapability) {
            // AI Power-Ups is not installed. Not an error: the activity log is entitled
            // separately, and an installation with one and not the other gets the timeline with
            // deterministic descriptions.
            this.answer = false;
            return;
        }

        try {
            const resolved = await this.resolveCapability.execute(ACTIVITY_LOG_SUMMARY_CAPABILITY);
            this.answer = resolved.isOk();
        } catch {
            this.answer = false;
        }
    }
}

export const CapabilityAvailability = SummaryModelAvailability.createImplementation({
    implementation: CapabilityAvailabilityImpl,
    // Optional, because AI Power-Ups is an extension rather than part of the platform. A required
    // dependency here would make an installation without it unable to record an entry at all —
    // constructor dependencies are resolved before any guard inside a method can run.
    dependencies: [[ResolveAiCapabilityUseCase, { optional: true }]]
});
