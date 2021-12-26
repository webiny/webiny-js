import React, { createContext, useContext, useEffect, useMemo } from "react";
import debounce from "lodash.debounce";
import { useAdmin } from "./admin";

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

const createEmptyRenderer = (name: string) => {
    return function EmptyRenderer() {
        useEffect(() => {
            // We need to debounce the log, as it sometimes only requires a single tick to get the new
            // composed component to render, and we don't want to scare developers for no reason.
            const debounced = debounce(() => {
                console.info(
                    `<${name}/> is not implemented! To provide an implementation, use the <Compose/> component.`
                );
            }, 100);

            return () => {
                debounced.cancel();
            };
        }, []);

        return null;
    };
};

export function makeComposable<TProps>(name, Component?: React.ComponentType<TProps>) {
    if (!Component) {
        Component = createEmptyRenderer(name);
    }
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
