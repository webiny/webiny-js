// @flow
import * as React from "react";
import { Ripple as RmwcRipple } from "@rmwc/ripple";

type Props = {
    // Any element that needs to be highlighted.
    children?: React.Node,

    // Choose the type of ripple.
    type?: "unbounded" | "primary" | "accent",

    // Makes the ripple disabled.
    disabled?: boolean
};

/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
const Ripple = (props: Props) => {
    // Let's pass "unbounded" / "primary" / "accent" flags as "type" prop instead.
    const type = props.type || "";

    return (
        <RmwcRipple {...{ [type]: true }} {...props}>
            {props.children}
        </RmwcRipple>
    );
};

export { Ripple };
