import {
    getCurrentInstance,
    onUnmounted,
    shallowRef,
    watch,
    type Ref,
    type WatchSource
} from "vue";
import { autorun, type IReactionDisposer } from "mobx";

/**
 * Bridges MobX into Vue: runs `fn` in a MobX `autorun` and writes the result into a shallow
 * ref. The ref updates whenever a MobX observable read by `fn` changes, and, when `source` is
 * given, whenever that Vue source changes too (the autorun is recreated with the new value).
 *
 * `fn` should return a plain value (`toJS(...)`), so MobX tracks everything it reads and Vue
 * gets a new reference on every change.
 */
export function useObservable<T, S = undefined>(
    fn: (source: S) => T,
    source?: WatchSource<S>
): Ref<T> {
    let disposer: IReactionDisposer | undefined;
    const value = shallowRef<T>() as Ref<T>;

    const run = (current: S) => {
        // On the server a render happens once and nothing unmounts, so an autorun would leak.
        if (typeof window === "undefined") {
            value.value = fn(current);
            return;
        }
        disposer?.();
        disposer = autorun(() => {
            value.value = fn(current);
        });
    };

    if (source) {
        watch(source, run, { immediate: true });
    } else {
        run(undefined as S);
    }

    if (getCurrentInstance()) {
        onUnmounted(() => disposer?.());
    }

    return value;
}
