import { useCallback, useState } from "react";

export const useSlider = (initialValue?: number, onValueChange?: (value: number) => void) => {
    const [localValue, setLocalValue] = useState(initialValue || 0);

    const handleValueChange = useCallback(
        (newValue: number) => {
            setLocalValue(newValue);
            onValueChange?.(newValue);
        },
        [onValueChange]
    );

    return [localValue, handleValueChange] as const;
};
