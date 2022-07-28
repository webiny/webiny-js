import React, { useContext, useEffect } from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { makeComposable } from "@webiny/react-composition";
import { RouterContext } from "./context/RouterContext";

export type LinkProps = RouterLinkProps;

const Link = makeComposable<LinkProps>("Link", ({ children, ...props }) => {
    const { onLink } = useContext(RouterContext);

    let { to } = props;

    if (typeof to === "string" && to.startsWith(window.location.origin)) {
        to = to.replace(window.location.origin, "");
    }

    useEffect(() => {
        onLink(to as string);
    }, [to]);

    const isInternal = typeof to === "string" ? to.startsWith("/") : true;
    const LinkComponent = isInternal ? RouterLink : "a";
    const componentProps = {
        ...props,
        [isInternal ? "to" : "href"]: to
    };

    return <LinkComponent {...componentProps}>{children}</LinkComponent>;
});

export { Link };
