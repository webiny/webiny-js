import React from "react";
import { buttonVariants } from "~/Button/index.js";
import { cn } from "~/utils.js";

interface BirthdayPickerCellProps {
    selected: boolean;
    disabled?: boolean;
    tabbable: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

/**
 * One day, month or year in a step's grid. It reads as a button: a ghost one, or a primary one
 * for the picked value, the same as the month and year grids of the other pickers.
 */
const BirthdayPickerCell = ({
    selected,
    disabled,
    tabbable,
    onClick,
    children
}: BirthdayPickerCellProps) => (
    <button
        type="button"
        disabled={disabled}
        aria-disabled={disabled}
        aria-pressed={selected}
        data-selected={selected}
        tabIndex={tabbable && !disabled ? 0 : -1}
        onClick={onClick}
        className={cn(
            buttonVariants({ variant: selected ? "primary" : "ghost", size: "md" }),
            "w-full tabular-nums"
        )}
    >
        {children}
    </button>
);

export { BirthdayPickerCell };
