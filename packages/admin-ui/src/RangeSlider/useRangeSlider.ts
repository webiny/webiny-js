import { useCallback, useMemo, useState } from "react";
import debounce from "lodash/debounce";

export interface UseRangeSlider {
    values: number[];
    onValuesChange: (value: number[]) => void;
}

export const useRangeSlider = (
    initialValue: number[],
    onValuesChange?: (value: number[]) => void
): UseRangeSlider => {
    const [localValues, setLocalValue] = useState(initialValue);

    const debouncedOnValueChange = useMemo(() => {
        return onValuesChange ? debounce(onValuesChange, 100) : undefined;
    }, [onValuesChange]);

    const handleValueChange = useCallback(
        (newValues: number[]) => {
            setLocalValue(newValues);
            debouncedOnValueChange?.(newValues);
        },
        [onValuesChange]
    );

    return {
        values: localValues,
        onValuesChange: handleValueChange
    };
};
