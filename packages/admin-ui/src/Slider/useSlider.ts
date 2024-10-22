import { useCallback, useState, useMemo } from "react";
import debounce from "lodash/debounce";

export interface UseSlider {
    value: number;
    onValueChange: (value: number) => void;
}

export const useSlider = (
    initialValue?: number,
    onValueChange?: (value: number) => void
): UseSlider => {
    const [localValue, setLocalValue] = useState(initialValue || 0);

    const debouncedOnValueChange = useMemo(() => {
        return onValueChange ? debounce(onValueChange, 100) : undefined;
    }, [onValueChange]);

    const handleValueChange = useCallback(
        (newValue: number) => {
            setLocalValue(newValue);
            debouncedOnValueChange?.(newValue);
        },
        [debouncedOnValueChange]
    );

    return {
        value: localValue,
        onValueChange: handleValueChange
    };
};
