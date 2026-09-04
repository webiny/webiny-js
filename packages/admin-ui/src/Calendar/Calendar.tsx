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

/*
 * `className` must be forwarded: react-day-picker passes `classNames.chevron` down to this
 * component, and that class carries `fill-current`. Without it the icon keeps Icon's default
 * `fill-inherit`, and since nothing in the popover tree sets a `fill` the SVG falls back to
 * its own black in every theme. With it, the chevron follows the nav button's
 * `text-neutral-strong` (and its disabled colour) via `currentColor`.
 */
function CalendarChevron(props: {
    orientation?: "left" | "right" | "up" | "down";
    className?: string;
}) {
    if (props.orientation === "left") {
        return (
            <Icon
                icon={<ChevronLeftIcon />}
                label="Previous"
                size="sm"
                color="inherit"
                className={props.className}
            />
        );
    }
    return (
        <Icon
            icon={<ChevronRightIcon />}
            label="Next"
            size="sm"
            color="inherit"
            className={props.className}
        />
    );
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
