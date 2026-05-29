import { shallowRef, onUnmounted, triggerRef, getCurrentInstance, type Ref } from "vue";
import { autorun } from "mobx";

/**
 * Bridges a MobX observable into a Vue shallow ref.
 *
 * The supplied `fn` is run inside a MobX `autorun`. Every time a MobX
 * observable accessed by `fn` changes, the ref is updated and Vue is told
 * to treat it as "dirty" so that all computed values and templates that
 * depend on it re-evaluate.
 *
 * Must be called inside a component setup() (or equivalent) so that
 * `onUnmounted` can clean up the MobX reaction automatically.
 */
export function useObservable<T>(fn: () => T): Ref<T> {
    const value = shallowRef<T>(fn());

    const disposer = autorun(() => {
        value.value = fn();
        // shallowRef won't trigger on the same object reference; triggerRef
        // forces Vue to re-evaluate all dependents regardless.
        triggerRef(value);
    });

    if (getCurrentInstance()) {
        onUnmounted(() => disposer());
    }

    return value as Ref<T>;
}
