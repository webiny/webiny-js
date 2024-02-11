import { useEffect } from "react";
import { DecorateeTypes, Decorator, useComposition } from "./Context";
import { useCompositionScope } from "~/CompositionScope";

export type BaseFunction = (...args: any) => any;

export type ComposedFunction = BaseFunction;

// eslint-disable-next-line @typescript-eslint/ban-types
export type ComposableFC<T> = T & {
    displayName?: string;
    original: T;
    originalName: string;
};

export interface ComposeProps {
    function?: DecorateeTypes;
    component?: DecorateeTypes;
    with: Decorator<DecorateeTypes> | Decorator<DecorateeTypes>[];
}

export const Compose = (props: ComposeProps) => {
    const { composeComponent } = useComposition();
    const scope = useCompositionScope();

    const targetFn = (props.function ?? props.component) as ComposableFC<BaseFunction>;

    useEffect(() => {
        if (typeof targetFn.original === "undefined") {
            console.warn(
                `You must make your function "${
                    targetFn.displayName ?? targetFn.name
                }" composable, by using the makeComposable() function!`
            );

            return;
        }

        const decorators = Array.isArray(props.with) ? props.with : [props.with];
        return composeComponent(targetFn.original, decorators, scope);
    }, [props.with]);

    return null;
};
