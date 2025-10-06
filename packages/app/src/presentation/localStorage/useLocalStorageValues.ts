import { useEffect, useRef, useState } from "react";
import { autorun } from "mobx";
import isEqual from "lodash/isEqual.js";
import { LocalStorageFeature } from "~/features/localStorage/index.js";
import { useFeature } from "~/shared/di/useFeature.js";

/**
 * Observes multiple keys in LocalStorage and returns an object of { key: value }.
 * Re-renders when any of the observed keys change.
 */
export function useLocalStorageValues<T extends Record<string, any>>(
    keys: (keyof T & string)[]
): Partial<T> {
    const { localStorageService } = useFeature(LocalStorageFeature);

    const [values, setValues] = useState<Partial<T>>(() => {
        const initial: Partial<T> = {};
        for (const key of keys) {
            initial[key] = localStorageService.get<any>(key);
        }
        return initial;
    });

    const valuesRef = useRef(values);

    useEffect(() => {
        const dispose = autorun(() => {
            const snapshot: Partial<T> = {};
            for (const key of keys) {
                snapshot[key] = localStorageService.get<any>(key);
            }

            if (!isEqual(snapshot, valuesRef.current)) {
                setValues(snapshot);
                valuesRef.current = snapshot;
            }
        });
        return () => dispose();
    }, [localStorageService, keys.join(",")]);

    return values;
}
