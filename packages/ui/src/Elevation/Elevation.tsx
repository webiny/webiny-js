import React from "react";
import cn from "classnames";

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
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Card` component from the `@webiny/admin-ui` package instead.
 */
const Elevation = ({ className, ...props }: ElevationProps) => {
    return (
        <div {...props} className={cn("bg-white shadow-md p-4", className)}>
            {props.children}
        </div>
    );
};

Elevation.displayName = "Elevation";

export { Elevation };
