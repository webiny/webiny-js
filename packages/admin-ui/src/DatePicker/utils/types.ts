import type { InputPrimitiveProps } from "~/Input/index.js";

interface DatePickerPreset {
    label: string;
    value: () => Date;
}

interface DatePickerBaseProps {
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    size?: InputPrimitiveProps["size"];
    variant?: InputPrimitiveProps["variant"];
    invalid?: InputPrimitiveProps["invalid"];
    yearRange?: [number, number];
    weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    onOpenChange?: (open: boolean) => void;
    displayFormat?: string;
}

interface DateOnlyPickerProps extends DatePickerBaseProps {
    type: "date";
    value?: string;
    onChange?: (value: string | undefined) => void;
    presets?: DatePickerPreset[];
}

interface TimeOnlyPickerProps extends DatePickerBaseProps {
    type: "time";
    value?: string;
    onChange?: (value: string | undefined) => void;
}

interface DateTimeLocalPickerProps extends DatePickerBaseProps {
    type: "datetime-local";
    value?: Date;
    onChange?: (value: Date | undefined) => void;
}

interface DateTimeTzPickerProps extends DatePickerBaseProps {
    type: "datetime-tz";
    value?: string;
    onChange?: (value: string | undefined) => void;
}

interface MonthPickerProps extends DatePickerBaseProps {
    type: "month";
    value?: string;
    onChange?: (value: string | undefined) => void;
}

interface YearPickerProps extends DatePickerBaseProps {
    type: "year";
    value?: number;
    onChange?: (value: number | undefined) => void;
}

interface DateRangePickerProps extends DatePickerBaseProps {
    type: "date-range";
    value?: { from?: Date; to?: Date };
    onChange?: (value: { from?: Date; to?: Date } | undefined) => void;
}

interface MultipleDatesPickerProps extends DatePickerBaseProps {
    type: "multiple-dates";
    value?: Date[];
    onChange?: (value: Date[]) => void;
}

interface MultipleMonthsPickerProps extends DatePickerBaseProps {
    type: "multiple-months";
    value?: string[];
    onChange?: (value: string[]) => void;
}

interface MultipleYearsPickerProps extends DatePickerBaseProps {
    type: "multiple-years";
    value?: number[];
    onChange?: (value: number[]) => void;
}

type DatePickerPrimitiveProps =
    | DateOnlyPickerProps
    | TimeOnlyPickerProps
    | DateTimeLocalPickerProps
    | DateTimeTzPickerProps
    | MonthPickerProps
    | YearPickerProps
    | DateRangePickerProps
    | MultipleDatesPickerProps
    | MultipleMonthsPickerProps
    | MultipleYearsPickerProps;

export {
    type DatePickerPreset,
    type DatePickerBaseProps,
    type DatePickerPrimitiveProps,
    type DateOnlyPickerProps,
    type TimeOnlyPickerProps,
    type DateTimeLocalPickerProps,
    type DateTimeTzPickerProps,
    type MonthPickerProps,
    type YearPickerProps,
    type DateRangePickerProps,
    type MultipleDatesPickerProps,
    type MultipleMonthsPickerProps,
    type MultipleYearsPickerProps
};
