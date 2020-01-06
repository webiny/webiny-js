import * as React from "react";
export declare type ElevationProps = {
    children?: React.ReactNode;
    z: number;
    transition?: boolean;
    className?: string;
};
/**
 * Elevation component visually raises any content by applying shadow.
 */
declare const Elevation: React.ForwardRefExoticComponent<ElevationProps & React.RefAttributes<any>>;
export { Elevation };
