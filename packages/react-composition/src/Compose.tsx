import { useEffect } from "react";
import { DecoratableTypes, useComposition } from "./Context";
import { useCompositionScope } from "~/CompositionScope";
import { ComposeWith, Decoratable, Enumerable } from "./types";

export interface ComposeProps {
    function?: DecoratableTypes;
    component?: DecoratableTypes;
    with: ComposeWith;
}

export const Compose = (props: ComposeProps) => {
    const { composeComponent } = useComposition();
    const scope = useCompositionScope();

    const targetFn = (props.function ?? props.component) as Decoratable;

    useEffect(() => {
        if (typeof targetFn.original === "undefined") {
            console.warn(
                `You must make your function "${
                    targetFn.originalName ?? targetFn.name
                }" composable, by using the makeDecoratable() function!`
            );

            return;
        }

        const decorators = Array.isArray(props.with) ? props.with : [props.with];
        return composeComponent(targetFn.original, decorators as Enumerable<ComposeWith>, scope);
    }, [props.with]);

    return null;
};
