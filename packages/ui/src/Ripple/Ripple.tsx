import React from "react";

interface Props {
    // Choose the type of ripple.
    type?: "unbounded" | "primary" | "accent";

    // Makes the ripple disabled.
    disabled?: boolean;

    children: React.ReactNode;
}

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 */
const Ripple = (props: Props) => {
    // Return only the children
    return <>{props.children}</>;
};

export { Ripple };
