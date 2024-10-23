import { useCallback, useState, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";
import { SliderProps } from "./Slider";

export interface UseSlider {
    value: number;
    labelValue: string;
    onValueChange: (value: number) => void;
}

export const useSlider = ({
    defaultValue,
    min,
    onValueChange,
    value,
    valueConverter
}: SliderProps): UseSlider => {
    const [localValue, setLocalValue] = useState(defaultValue ?? value ?? min ?? 0);

    useEffect(() => {
        if (value !== undefined && value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

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

    const labelValue = useMemo(() => {
        return valueConverter ? valueConverter(localValue) : String(localValue);
    }, [localValue, valueConverter]);

    return {
        value: localValue,
        labelValue,
        onValueChange: handleValueChange
    };
};
