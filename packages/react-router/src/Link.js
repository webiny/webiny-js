import React, { useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { RouterContext } from "./context/RouterContext";

function Link({ children, ...props }) {
    const { onLink } = useContext(RouterContext);

    useEffect(() => {
        onLink(props.to);
    }, [props.to]);

    return <RouterLink {...props}>{children}</RouterLink>;
}

export { Link };
