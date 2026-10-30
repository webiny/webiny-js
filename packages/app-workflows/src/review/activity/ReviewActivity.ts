import { ReviewActivity as Abstraction } from "./abstractions.js";
import type { ReviewActivityListener } from "./abstractions.js";
import type { ReviewActivitySignal } from "./abstractions.js";

interface ReviewActivitySubscription {
    namespaces: string[];
    listener: ReviewActivityListener;
}

/*
 * The live-update bus (R210). Own actions and incoming notifications signal it; list and widget
 * presenters subscribe to their namespaces and refetch. No polling, no stored state.
 */
class ReviewActivityImpl implements Abstraction.Interface {
    private subscriptions = new Set<ReviewActivitySubscription>();

    subscribe(namespaces: string[], listener: ReviewActivityListener): () => void {
        const subscription: ReviewActivitySubscription = {
            namespaces: [...namespaces],
            listener
        };
        this.subscriptions.add(subscription);
        return () => {
            this.subscriptions.delete(subscription);
        };
    }

    /*
     * Delivery iterates a snapshot of the subscriptions taken when `notify` starts: a listener
     * added during delivery only sees later signals, one removed during delivery may still
     * receive the current signal.
     */
    notify(signal: ReviewActivitySignal): void {
        for (const subscription of [...this.subscriptions]) {
            if (!subscription.namespaces.includes(signal.namespace)) {
                continue;
            }
            try {
                subscription.listener(signal);
            } catch (error) {
                console.error("[ReviewActivity] A listener failed.", error);
            }
        }
    }
}

export const ReviewActivity = Abstraction.createImplementation({
    implementation: ReviewActivityImpl,
    dependencies: []
});
