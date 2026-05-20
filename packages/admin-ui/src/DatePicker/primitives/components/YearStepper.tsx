import React from "react";
import { ReactComponent as ChevronLeftIcon } from "@webiny/icons/chevron_left.svg";
import { ReactComponent as ChevronRightIcon } from "@webiny/icons/chevron_right.svg";
import { IconButton } from "~/Button/index.js";
import { Icon } from "~/Icon/index.js";

interface YearStepperProps {
    year: number;
    onYearChange: (year: number) => void;
}

const YearStepper = ({ year, onYearChange }: YearStepperProps) => {
    return (
        <div className="flex items-center justify-center gap-sm py-xs">
            <IconButton
                variant="ghost"
                size="sm"
                icon={<Icon icon={<ChevronLeftIcon />} label="Previous year" size="sm" />}
                onClick={() => onYearChange(year - 1)}
            />
            <span className="text-md font-semibold text-neutral-strong min-w-[4ch] text-center">
                {year}
            </span>
            <IconButton
                variant="ghost"
                size="sm"
                icon={<Icon icon={<ChevronRightIcon />} label="Next year" size="sm" />}
                onClick={() => onYearChange(year + 1)}
            />
        </div>
    );
};

export { YearStepper, type YearStepperProps };
