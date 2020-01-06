import * as React from "react";
import { ChipProps as RmwcChipProps } from "@rmwc/chip";
export declare type ChipProps = RmwcChipProps & {
    /**
     * Chip content
     */
    children?: React.ReactNode;
};
export declare const Chip: (props: ChipProps) => JSX.Element;
