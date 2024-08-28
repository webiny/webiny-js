import React from "react";
import { Card, CardContent, CardProps } from "@webiny/admin-ui";

export interface ElevationProps extends CardProps {
    // Any element that needs to be highlighted.
    children?: React.ReactNode;

    z: number;

    // Adds smooth transitions when the z value changes.
    transition?: boolean;

    // CSS class name
    className?: string;

    // Style object
    style?: React.CSSProperties;
}

/**
 * @deprecated Use `Card` component instead.
 */
const Elevation = (props: ElevationProps) => {
    return <Card {...props} content={<CardContent>{props.children}</CardContent>} />;
};

Elevation.displayName = "Elevation";

export { Elevation };
