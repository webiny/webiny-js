import * as React from "react";
import { useBind } from "~/Form";
import { BindComponentProps } from "~/types";

export function Bind({ children, ...props }: BindComponentProps) {
    const bind = useBind(props);

    if (React.isValidElement(children)) {
        if (!bind.disabled) {
            bind.disabled = children.props.disabled;
        }
        return React.cloneElement(children, { ...children.props, ...bind });
    }

    return typeof children === "function" ? children(bind) : null;
}
