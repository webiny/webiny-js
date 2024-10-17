import React, { ComponentProps } from "react";
import { ButtonRenderer } from "@webiny/app-page-builder-elements/renderers/button";
import { Link } from "@webiny/react-router";

const LinkComponent: ComponentProps<typeof ButtonRenderer>["linkComponent"] = ({
    href,
    children,
    ...rest
}) => {
    return (
        // While testing, we noticed that the `href` prop is sometimes `null` or `undefined`.
        // Hence, the `href || ""` part. This fixes the issue.
        <Link to={href || ""} {...rest}>
            {children}
        </Link>
    );
};

export const AddButtonLinkComponent = ButtonRenderer.createDecorator(Original => {
    return function ButtonWithLink(props) {
        return <Original {...props} linkComponent={props.linkComponent ?? LinkComponent} />;
    };
});
