import * as React from "react";
import { useBind } from "~/Form";
import { BindComponentProps } from "~/types";

export function Bind<T = any>({ children, ...props }: BindComponentProps<T>) {
    const bind = useBind<T>(props);

    if (React.isValidElement(children)) {
        if (!bind.disabled) {
            bind.disabled = children.props.disabled;
        }
        return React.cloneElement(children, { ...children.props, ...bind });
    }

    return typeof children === "function" ? children(bind) : null;
}
