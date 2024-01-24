import React, { useEffect } from "react";
import { HigherOrderComponent, useComposition } from "./Context";
import { useCompositionScope } from "~/CompositionScope";

export type ComposableFC<TProps = unknown> = React.ComponentType<TProps> & {
    original: React.ComponentType<TProps>;
    originalName: string;
};

export interface ComposeProps {
    /**
     * Component to compose.
     * NOTE: ComposableFC<TProps> use `any` because the type of the component props is irrelevant.
     */
    component: ComposableFC<any>;
    with: HigherOrderComponent | HigherOrderComponent[];
}

export const Compose = (props: ComposeProps) => {
    const { composeComponent } = useComposition();
    const scope = useCompositionScope();

    useEffect(() => {
        if (typeof props.component.original === "undefined") {
            console.warn(
                `You must make your component "<${props.component.displayName}>" composable, by using the makeComposable() function!`
            );

            return;
        }

        const hocs = Array.isArray(props.with) ? props.with : [props.with];
        return composeComponent(props.component.original, hocs, scope);
    }, [props.with]);

    return null;
};
