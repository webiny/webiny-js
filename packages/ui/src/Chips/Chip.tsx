import React, { useCallback } from "react";
import { Chip as RmwcChip, ChipProps as RmwcChipProps } from "@rmwc/chip";

export interface ChipProps extends Omit<RmwcChipProps, "onRemove" | "trailingIcon"> {
    onRemove: (ev: React.MouseEvent<HTMLSpanElement>) => void;
    trailingIcon?: React.ReactNode;
}

export const Chip = (props: ChipProps) => {
    const { children, trailingIcon, onRemove, ...rest } = props;

    const onRemoveCb = useCallback(
        (ev: React.MouseEvent<HTMLSpanElement>) => {
            if (!onRemove) {
                return;
            }
            onRemove(ev);
        },
        [onRemove]
    );

    let trailingIconElement = null;
    if (trailingIcon) {
        trailingIconElement = (
            <span className={"mdc-chip__icon mdc-chip__icon--trailing"} onClick={onRemoveCb}>
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
