import * as React from "react";
import { Ripple as RmwcRipple } from "@rmwc/ripple";

interface Props {
    // Choose the type of ripple.
    type?: "unbounded" | "primary" | "accent";

    // Makes the ripple disabled.
    disabled?: boolean;
}

/**
 * Use Ripple component to display a list of choices, once the handler is triggered.
 */
const Ripple: React.FC<Props> = props => {
    // Let's pass "unbounded" / "primary" / "accent" flags as "type" prop instead.
    const type = props.type || "surface";

    return (
        <RmwcRipple {...{ [type]: true }} {...props}>
            {props.children}
        </RmwcRipple>
    );
};

export { Ripple };
