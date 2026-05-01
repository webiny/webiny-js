import React from "react";
import { makeDecoratable } from "~/utils.js";
import type { DatePickerPrimitiveProps } from "../utils/types.js";
import { DateOnlyPicker } from "./DateOnlyPicker.js";
import { TimeOnlyPicker } from "./TimeOnlyPicker.js";
import { DateTimePicker } from "./DateTimePicker.js";
import { MonthPicker } from "./MonthPicker.js";
import { WeekPicker } from "./WeekPicker.js";
import { YearPicker } from "./YearPicker.js";
import { DateRangePicker } from "./DateRangePicker.js";
import { MultipleDatesPicker } from "./MultipleDatesPicker.js";
import { MultipleMonthsPicker } from "./MultipleMonthsPicker.js";
import { MultipleYearsPicker } from "./MultipleYearsPicker.js";

const DecoratableDatePickerPrimitive = (props: DatePickerPrimitiveProps) => {
    switch (props.type) {
        case "date":
            return <DateOnlyPicker {...props} />;
        case "time":
            return <TimeOnlyPicker {...props} />;
        case "dateTimeLocal":
            return <DateTimePicker {...props} withTimezone={false} />;
        case "dateTimeTz":
            return <DateTimePicker {...props} withTimezone={true} />;
        case "month":
            return <MonthPicker {...props} />;
        case "week":
            return <WeekPicker {...props} />;
        case "year":
            return <YearPicker {...props} />;
        case "dateRange":
            return <DateRangePicker {...props} />;
        case "multipleDates":
            return <MultipleDatesPicker {...props} />;
        case "multipleMonths":
            return <MultipleMonthsPicker {...props} />;
        case "multipleYears":
            return <MultipleYearsPicker {...props} />;
    }
};

const DatePickerPrimitive = makeDecoratable("DatePickerPrimitive", DecoratableDatePickerPrimitive);

export { DatePickerPrimitive, type DatePickerPrimitiveProps };
