import * as React from "react";
import { useBind } from "~/useBind";
import { BindComponentProps } from "~/types";

export function Bind({ children, ...props }: BindComponentProps) {
    const bind = useBind(props);

    if (React.isValidElement(children)) {
        if (!bind.disabled) {
            /**
             * We can safely set the `disabled` prop on the child element, because we know it's a valid React element.
             */
            // @ts-expect-error
            bind.disabled = children.props.disabled;
        }
        // @ts-expect-error
        return React.cloneElement(children, { ...children.props, ...bind });
    }

    return typeof children === "function" ? children(bind) : null;
}
