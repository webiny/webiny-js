import isEqual from "lodash/isEqual.js";
import { useState, useEffect, useMemo } from "react";
import type { IReactionDisposer } from "mobx";
import { reaction } from "mobx";

type Equals<T> = (a: T, b: T) => boolean;

/**
 * Subscribe to part of the document state.
 * @param selector   Pick the slice of state you care about.
 * @param equals     (optional) comparator, defaults to a strict structural compare
 *                   (`lodash/isEqual`), cheap enough to run for every subscribed element
 */
export function useSelectFromState<TState, T>(
    getState: () => TState,
    selector: (doc: TState) => T,
    deps: React.DependencyList = [],
    equals: Equals<T> = isEqual
): T {
    // Pull the initial slice synchronously
    const initialValue = useMemo(() => selector(getState()), deps);
    const [value, setValue] = useState<T>(initialValue);

    useEffect(() => {
        setValue(selector(getState())); // reset state on dep change
    }, deps);

    useEffect(() => {
        // reaction tracks selector(doc) and only fires when newVal !== oldVal
        const disposer: IReactionDisposer = reaction(
            () => {
                const state = getState();

                return selector(state);
            },
            (newValue, oldValue) => {
                if (!equals(oldValue, newValue)) {
                    setValue(newValue);
                }
            },
            {
                // use your comparator to decide if newValue “really” changed
                equals,
                // we already set initial via useState
                fireImmediately: false
            }
        );

        return () => {
            // clean up when the component unmounts
            disposer();
        };
    }, [getState, selector, equals, ...deps]);

    return value;
}
