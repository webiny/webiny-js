import React, { createContext, useContext, useMemo } from "react";
import { BaseFunction, ComposableFC } from "./Compose";
import { useComponent } from "./Context";

const ComposableContext = createContext<string[]>([]);
ComposableContext.displayName = "ComposableContext";

function useComposableParents() {
    const context = useContext(ComposableContext);
    if (!context) {
        return [];
    }

    return context;
}

const nullRenderer = () => null;

/**
 * @deprecated Use `makeDecoratable` instead.
 */
export function makeComposable<T extends BaseFunction>(
    name: string,
    Component: T = nullRenderer as T
) {
    const Composable = (props: Parameters<T>[0]) => {
        const parents = useComposableParents();
        const ComposedComponent = useComponent(Component);

        const context = useMemo(() => [...parents, name], [parents, name]);

        return (
            <ComposableContext.Provider value={context}>
                <ComposedComponent {...props}>{props.children}</ComposedComponent>
            </ComposableContext.Provider>
        );
    };

    Composable.original = Component;
    Composable.originalName = name;
    Composable.displayName = `Composable<${name}>`;

    return Composable as ComposableFC<T>;
}
