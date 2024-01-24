import React from "react";
import { Chip as RmwcChip, ChipProps as RmwcChipProps } from "@rmwc/chip";

export type ChipProps = RmwcChipProps;

export const Chip = (props: ChipProps) => {
    const { children, ...rest } = props;
    return <RmwcChip {...rest}>{children}</RmwcChip>;
};
