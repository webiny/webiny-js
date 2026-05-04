import { computed, type Ref } from "vue";
import { useObservable } from "./useObservable.js";

/**
 * Selects a slice of MobX state and exposes it as a Vue computed ref.
 *
 * - `getState` is tracked by MobX: any observable accessed inside it causes
 *   re-evaluation when it changes.
 * - `selector` is then applied to the latest state value in a Vue computed,
 *   so it also re-runs when any Vue reactive value accessed inside it changes.
 */
export function useSelectFromState<TState, T>(
    getState: () => TState,
    selector: (state: TState) => T
): Ref<T> {
    const stateRef = useObservable(getState);
    return computed(() => selector(stateRef.value)) as unknown as Ref<T>;
}
