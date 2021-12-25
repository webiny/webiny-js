import React, { useEffect } from "react";
import { HigherOrderComponent, useAdmin } from "~/admin";

export interface ComposeProps {
    component: React.ComponentType<unknown> & { original: React.ComponentType<unknown> };
    with: HigherOrderComponent | HigherOrderComponent[];
}

export const Compose = (props: ComposeProps) => {
    const { addComponentWrappers } = useAdmin();

    useEffect(() => {
        if (typeof props.component.original === "undefined") {
            console.warn(
                `You must make your component "<${props.component.displayName}>" composable, by using the makeComposable() function!`
            );

            return;
        }

        const hocs = Array.isArray(props.with) ? props.with : [props.with];
        return addComponentWrappers(props.component.original, hocs);
    }, [props.with]);

    return null;
};
