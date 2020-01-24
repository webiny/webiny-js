import * as React from "react";
import {
    Typography as RwmcTypography,
    TypographyProps as RmwcTypographyProps
} from "@rmwc/typography";

type TypographyProps = RmwcTypographyProps & {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    tag?: string;
};

/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
const Typography = (props: TypographyProps) => {
    return <RwmcTypography {...props}>{props.children}</RwmcTypography>;
};

export { Typography };
