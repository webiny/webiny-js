import { useCallback, useState } from "react";

export const useRangeSlider = (
    initialValue: number[],
    onValueChange?: (value: number[]) => void
) => {
    const [localValue, setLocalValue] = useState(initialValue);

    const handleValueChange = useCallback(
        (newValue: number[]) => {
            setLocalValue(newValue);
            onValueChange?.(newValue);
        },
        [onValueChange]
    );

    return [localValue, handleValueChange] as const;
};
