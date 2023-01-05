import React from "react";
import {
    Typography as RwmcTypography,
    TypographyProps as RmwcTypographyProps
} from "@rmwc/typography";

interface TypographyProps extends RmwcTypographyProps {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    tag?: string;
}

/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
const Typography: React.FC<TypographyProps> = props => {
    return <RwmcTypography {...props}>{props.children}</RwmcTypography>;
};

export { Typography, TypographyProps };
