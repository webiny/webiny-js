import React, { createContext, useContext, useMemo } from "react";
import { useAdmin } from "~/admin/index";

const useComponent = Component => {
    const { wrappers } = useAdmin();
    const recipe = wrappers.get(Component);

    if (!recipe) {
        return Component;
    }

    return recipe.component;
};

const ComposableContext = createContext([]);
ComposableContext.displayName = "ComposableContext";

function useComposableParents() {
    const context = useContext(ComposableContext);
    if (!context) {
        return [];
    }

    return context;
}

export function makeComposable<TProps>(name, Component: React.ComponentType<TProps>) {
    const Composable = (props: TProps & { children?: unknown }) => {
        const parents = useComposableParents();
        const WrappedComponent = useComponent(Component);

        const context = useMemo(() => [...parents, name], [parents, name]);

        return (
            <ComposableContext.Provider value={context}>
                <WrappedComponent {...props}>{props.children}</WrappedComponent>
            </ComposableContext.Provider>
        );
    };

    Component.displayName = name;

    Composable.original = Component;
    Composable.originalName = name;
    Composable.displayName = `Composable<${name}>`;

    return Composable;
}
