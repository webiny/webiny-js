// @flow
import * as React from "react";
import { Elevation as RmwcElevation } from "@rmwc/elevation";

type Props = {
    // Any element that needs to be highlighted.
    children?: React.Node,

    // Increasing this number (from 0 to 24) will increase the amount of shadow applied.
    z: number,

    // Adds smooth transitions when the z value changes.
    transition?: boolean,
};

/**
 * Elevation component visually raises any content by applying shadow.
 */
const Elevation = React.forwardRef((props: Props, ref: React.ElementRef) => {
    return (
        <RmwcElevation ref={ref} {...props}>
            {props.children}
        </RmwcElevation>
    );
});

Elevation.displayName = "Elevation";

export { Elevation };
