import { getCurrentInstance } from "vue";
import { onUnmounted } from "vue";
import { shallowRef } from "vue";
import type { Ref } from "vue";
import { Reaction } from "mobx";

export interface MobxTracking {
    /** Read it in the render function so Vue re-renders when the reaction fires. */
    version: Ref<number>;
    /** Runs `fn` and records the MobX observables it reads. */
    track: <T>(fn: () => T) => T;
}

/**
 * Re-renders the calling component when a MobX observable read inside `track()` changes, the
 * way `observer` does for a React component.
 *
 * On the server `track()` only calls `fn`. A render happens once there and nothing unmounts,
 * so a reaction would never be disposed.
 */
export function useMobxTracking(name: string): MobxTracking {
    const version = shallowRef(0);

    if (typeof window === "undefined") {
        return { version, track: fn => fn() };
    }

    const reaction = new Reaction(name, () => {
        version.value++;
    });

    if (getCurrentInstance()) {
        onUnmounted(() => reaction.dispose());
    }

    const track = <T>(fn: () => T): T => {
        let result!: T;
        let failure: { error: unknown } | undefined;
        // `Reaction.track` logs an error thrown inside it and does not rethrow it. Catch it here
        // and rethrow it after tracking, so the caller sees it, as it does on the server.
        reaction.track(() => {
            try {
                result = fn();
            } catch (error) {
                failure = { error };
            }
        });
        if (failure) {
            throw failure.error;
        }
        return result;
    };

    return { version, track };
}
