import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ReviewActivity } from "~/review/activity/abstractions.js";

interface FakeSubscription {
    namespaces: string[];
    listener: ReviewActivity.Listener;
}

export interface FakeReviewActivity extends ReviewActivity.Interface {
    subscribe: Mock<ReviewActivity.Interface["subscribe"]>;
    notify: Mock<ReviewActivity.Interface["notify"]>;
    // How many subscriptions are active right now.
    listenerCount(): number;
}

/*
 * A bus that records its calls and, like the real one, delivers a signal synchronously to the
 * listeners of its namespace; `subscribe` returns a working unsubscribe.
 */
export const createFakeActivity = (): FakeReviewActivity => {
    const subscriptions = new Set<FakeSubscription>();

    const subscribe = vi.fn((namespaces: string[], listener: ReviewActivity.Listener) => {
        const subscription: FakeSubscription = { namespaces, listener };
        subscriptions.add(subscription);
        return () => {
            subscriptions.delete(subscription);
        };
    });

    const notify = vi.fn((signal: ReviewActivity.Signal) => {
        for (const subscription of [...subscriptions]) {
            if (subscription.namespaces.includes(signal.namespace)) {
                subscription.listener(signal);
            }
        }
    });

    return { subscribe, notify, listenerCount: () => subscriptions.size };
};
