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

    // Ref for inner DOM element
    elementRef?: any
};

/**
 * Elevation component visually raises any content by applying shadow.
 */
const Elevation = (props: Props) => {
    return <RmwcElevation {...props}>{props.children}</RmwcElevation>;
};

export { Elevation };
