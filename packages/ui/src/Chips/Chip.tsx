import * as React from "react";
import { Chip as RmwcChip, ChipProps as RmwcChipProps } from "@rmwc/chip";

export type ChipProps = RmwcChipProps & {
    /**
     * Chip content
     */
    children?: React.ReactNode;
};

export const Chip = (props: ChipProps) => {
    const { children, ...rest } = props;
    return <RmwcChip {...rest}>{children}</RmwcChip>;
};
