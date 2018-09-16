// @flow
import { Typography as RwmcTypography } from "@rmwc/typography";
import * as React from "react";

type Props = {
    // Text style.
    use:
        | "headline1"
        | "headline2"
        | "headline3"
        | "headline4"
        | "headline5"
        | "headline6"
        | "subtitle1"
        | "subtitle2"
        | "body1"
        | "body2"
        | "caption"
        | "button"
        | "overline",

    // Any element that needs to be highlighted.
    children?: React.Node
};

/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
const Typography = (props: Props) => {
    return <RwmcTypography {...props}>{props.children}</RwmcTypography>;
};

export { Typography };
