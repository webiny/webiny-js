import * as React from "react";
import { TypographyProps as RmwcTypographyProps } from "@rmwc/typography";
declare type TypographyProps = RmwcTypographyProps & {
    children?: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
};
/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
declare const Typography: (props: TypographyProps) => JSX.Element;
export { Typography };
