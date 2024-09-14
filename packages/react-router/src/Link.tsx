import React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";
import { makeDecoratable } from "@webiny/react-composition";

export type LinkProps = RouterLinkProps;

const Link = makeDecoratable("Link", ({ children, ...props }: LinkProps) => {
    let { to } = props;

    if (typeof to === "string" && to.startsWith(window.location.origin)) {
        to = to.replace(window.location.origin, "");
    }

    const isInternal = typeof to === "string" ? to.startsWith("/") : true;
    const LinkComponent = isInternal ? RouterLink : "a";
    const componentProps = {
        ...props,
        [isInternal ? "to" : "href"]: to
    };

    return <LinkComponent {...componentProps}>{children}</LinkComponent>;
});

export { Link };
