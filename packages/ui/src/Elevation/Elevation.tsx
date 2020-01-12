import * as React from "react";
import { Elevation as RmwcElevation } from "@rmwc/elevation";

export type ElevationProps = {
    // Any element that needs to be highlighted.
    children?: React.ReactNode;

    // Increasing this number (from 0 to 24) will increase the amount of shadow applied.
    z: number;

    // Adds smooth transitions when the z value changes.
    transition?: boolean;

    // CSS class name
    className?: string;

    // Style object
    style?: React.CSSProperties;
};

/**
 * Elevation component visually raises any content by applying shadow.
 */
const Elevation = React.forwardRef((props: ElevationProps, ref: React.Ref<any>) => {
    return (
        <RmwcElevation ref={ref} {...props}>
            {props.children}
        </RmwcElevation>
    );
});

Elevation.displayName = "Elevation";

export { Elevation };
