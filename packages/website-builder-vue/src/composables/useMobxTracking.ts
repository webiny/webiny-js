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
        reaction.track(() => {
            result = fn();
        });
        return result;
    };

    return { version, track };
}
