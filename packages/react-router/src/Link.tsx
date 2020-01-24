import React, { useContext, useEffect } from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { RouterContext } from "./context/RouterContext";

export type LinkProps = RouterLinkProps;

function Link({ children, ...props }: LinkProps) {
    const { onLink } = useContext(RouterContext);

    useEffect(() => {
        onLink(props.to as string);
    }, [props.to]);

    return <RouterLink {...props}>{children}</RouterLink>;
}

export { Link };
