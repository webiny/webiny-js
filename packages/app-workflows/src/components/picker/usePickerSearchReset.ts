import { useEffect, useRef } from "react";

/*
 * A remount (see `usePickerRemountKey`) clears the admin-ui picker's input, also while the user
 * was typing, for example when a chosen item's label arrives. `reset` starts the search over then,
 * so the list is no longer filtered by text the input no longer shows. The first render does not
 * reset: nothing was typed yet.
 */
export const usePickerSearchReset = (remountKey: number, query: string, reset: () => void) => {
    const shownKey = useRef(remountKey);

    useEffect(() => {
        if (shownKey.current === remountKey) {
            return;
        }
        shownKey.current = remountKey;
        if (query !== "") {
            reset();
        }
    }, [remountKey]);
};
