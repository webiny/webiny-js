import * as React from "react";
import { Chip } from "./Chip";
export declare type ChipsProps = {
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
export declare const Chips: (props: ChipsProps) => JSX.Element;
