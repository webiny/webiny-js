import React, { useContext, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { RouterContext } from "./context/RouterContext";
import PropTypes from "prop-types";

export type LinkProps =  {
    to: string,
    href: string,
    noFollow: boolean,
    newTab: boolean,
    children: any,
    className: string,
    onClick: () => void
}

function Link({children, ...props}: LinkProps) {
        const { onLink } = useContext(RouterContext)

        const isInternal = 'href' in props ? props.href.startsWith("/") : false
        const LinkComponent = isInternal ? RouterLink : "a"
        const componentProps = {
            ...props,
            rel: props.noFollow ? "nofollow" : null,
            target: props.newTab ? "_blank" : "_self",
            [isInternal ? "to" : "href"]: 'href' in props ? props.href : null
        }

        return (
            <LinkComponent 
                {...componentProps}>
                {children}
            </LinkComponent>
        );
}

export { Link };
