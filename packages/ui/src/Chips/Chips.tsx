import * as React from "react";
import classNames from "classnames";
import { ChipSet } from "@rmwc/chip";
import { Chip } from "./Chip";
import { chipIconWrapper, disabledChips } from "./styles";

export type ChipsProps = {
    /**
     * Chips to show
     */
    children?: React.ReactElement<typeof Chip>[];

    /**
     * Is chip disabled?
     */
    disabled?: boolean;

    /**
     * CSS class name
     */
    className?: string;
};

export const Chips = (props: ChipsProps) => {
    const { children, className, disabled, ...rest } = props;

    return (
        <React.Fragment>
            <ChipSet
                {...rest}
                className={classNames(className, chipIconWrapper, {
                    [disabledChips]: disabled
                })}
            >
                {children}
            </ChipSet>
        </React.Fragment>
    );
};
