import React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { ReactComponent as ChevronLeftIcon } from "@webiny/icons/chevron_left.svg";
import { ReactComponent as ChevronRightIcon } from "@webiny/icons/chevron_right.svg";
import { Icon } from "~/Icon/index.js";
import { cn, makeDecoratable } from "~/utils.js";
import { calendarClassNames } from "./calendarClassNames.js";

type CalendarProps = DayPickerProps & {
    className?: string;
};

function CalendarChevron(props: { orientation?: "left" | "right" | "up" | "down" }) {
    if (props.orientation === "left") {
        return <Icon icon={<ChevronLeftIcon />} label="Previous" size="sm" color="inherit" />;
    }
    return <Icon icon={<ChevronRightIcon />} label="Next" size="sm" color="inherit" />;
}

const DecoratableCalendar = ({ className, classNames, components, ...props }: CalendarProps) => {
    return (
        <DayPicker
            {...props}
            classNames={{ ...calendarClassNames, ...classNames }}
            components={{ Chevron: CalendarChevron, ...components }}
            className={cn(className)}
        />
    );
};

const Calendar = makeDecoratable("Calendar", DecoratableCalendar);

export { Calendar, type CalendarProps };
