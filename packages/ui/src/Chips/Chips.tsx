import React from "react";
import classNames from "classnames";
import { ChipSet } from "@rmwc/chip";
import { Chip } from "./Chip";
import { chipIconWrapper, disabledChips } from "./styles";

export interface ChipsProps {
    /**
     * Chips to show
     */
    children?: React.ReactElement<typeof Chip> | React.ReactElement<typeof Chip>[];

    /**
     * Is chip disabled?
     */
    disabled?: boolean;

    /**
     * CSS class name
     */
    className?: string;

    /**
     * Style object.
     */
    style?: React.CSSProperties;
}

export const Chips = (props: ChipsProps) => {
    const { children, className, disabled, ...rest } = props;

    return (
        <ChipSet
            {...rest}
            className={classNames("mdc-evolution-chip-set", className, chipIconWrapper, {
                [disabledChips]: disabled
            })}
        >
            {children}
        </ChipSet>
    );
};
