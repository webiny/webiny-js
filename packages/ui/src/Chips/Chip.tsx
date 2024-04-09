import React from "react";
import { Chip as RmwcChip, ChipProps as RmwcChipProps } from "@rmwc/chip";

export interface ChipProps extends Omit<RmwcChipProps, "onRemove"> {
    onRemove: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export const Chip = (props: ChipProps) => {
    const { children, trailingIcon, onRemove, ...rest } = props;

    let trailingIconElement = null;
    if (trailingIcon) {
        trailingIconElement = (
            <span
                className={"mdc-chip__icon mdc-chip__icon--trailing"}
                onClick={e => {
                    if (onRemove) {
                        onRemove(e);
                    }
                }}
            >
                {trailingIcon}
            </span>
        );
    }

    return (
        <RmwcChip {...rest}>
            {children} {trailingIconElement}
        </RmwcChip>
    );
};
