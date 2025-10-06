import { useCallback, useState } from "react";

export interface UseToggler {
    on: boolean;
    toggleOn: () => void;
    toggleOff: () => void;
    toggle: () => void;
}

export function useToggler(defaultValue = false): UseToggler {
    const [on, setOn] = useState(defaultValue);

    const toggleOn = useCallback(() => setOn(true), []);
    const toggleOff = useCallback(() => setOn(false), []);
    const toggle = useCallback(() => setOn(prev => !prev), []);

    return {
        on,
        toggleOn,
        toggleOff,
        toggle
    };
}
