import { useState, useCallback } from "react";
import { useIsMounted } from "./useIsMounted";

export function useStateIfMounted<T>(
    defaultState: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(defaultState);
    const { isMounted } = useIsMounted();

    const setStateIfMounted = useCallback(
        (state: React.SetStateAction<T>) => {
            if (isMounted()) {
                setState(state);
            }
        },
        [isMounted]
    );

    return [state, setStateIfMounted];
}
