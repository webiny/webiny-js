import { useCallback, useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { RangeSliderProps } from "./RangeSlider";

export interface UseRangeSlider {
    values: number[];
    labelValues: string[];
    onValuesChange: (value: number[]) => void;
}

export const useRangeSlider = ({
    value,
    defaultValue,
    min = 0,
    max = 100,
    onValueChange,
    valueConverter
}: RangeSliderProps): UseRangeSlider => {
    const [localValues, setLocalValue] = useState(defaultValue ?? value ?? [min, max]);

    useEffect(() => {
        if (value !== undefined && value !== localValues) {
            setLocalValue(value);
        }
    }, [value]);

    const debouncedOnValueChange = useMemo(() => {
        return onValueChange ? debounce(onValueChange, 100) : undefined;
    }, [onValueChange]);

    const handleValueChange = useCallback(
        (newValues: number[]) => {
            setLocalValue(newValues);
            debouncedOnValueChange?.(newValues);
        },
        [debouncedOnValueChange]
    );

    const labelValues = useMemo(() => {
        return localValues.map(value => (valueConverter ? valueConverter(value) : String(value)));
    }, [localValues, valueConverter]);

    return {
        values: localValues,
        labelValues,
        onValuesChange: handleValueChange
    };
};
