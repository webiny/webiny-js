import * as React from "react";
import { IconButtonProps as RmwcIconButtonProps } from "@rmwc/icon-button";
import { FormComponentProps } from "../../types";
export declare type IconButtonProps = FormComponentProps & RmwcIconButtonProps & {
    /**
     * Icon should be provided as an SvgComponent.
     */
    icon: React.ReactNode;
    /**
     * Button label
     */
    label?: string;
    /**
     * onClick handler
     * @param event
     */
    onClick?: (event: React.MouseEvent) => void;
    /**
     * Custom CSS class
     */
    className?: string;
};
/**
 * Shows the icon button.
 * @param props
 * @returns {*}
 * @constructor
 */
declare const IconButton: (props: IconButtonProps) => JSX.Element;
export { IconButton };
