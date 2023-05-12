import React, {
    FC,
    ComponentType,
    useState,
    useCallback,
    createContext,
    useContext,
    useMemo
} from "react";

export function compose(...fns: HigherOrderComponent[]) {
    return function ComposedComponent(Base: FC<unknown>): FC<unknown> {
        return fns.reduceRight((Component, hoc) => hoc(Component), Base);
    };
}

interface ComposedComponent {
    /**
     * Ready to use React component.
     */
    component: ComponentType<unknown>;
    /**
     * HOCs used to compose the original component.
     */
    hocs: HigherOrderComponent[];
}

/**
 * IMPORTANT: TInputProps default type is `any` because this interface is use as a prop type in the `Compose` component.
 * You can pass any HigherOrderComponent as a prop, regardless of its TInputProps type. The only way to allow that is
 * to let it be `any` in this interface.
 */
export interface HigherOrderComponent<TInputProps = any, TOutputProps = TInputProps> {
    (Component: FC<TInputProps>): FC<TOutputProps>;
}

type ComposedComponents = Map<ComponentType<unknown>, ComposedComponent>;

interface CompositionContext {
    components: ComposedComponents;
    getComponent(component: ComponentType<unknown>): ComponentType<unknown> | undefined;
    composeComponent(component: ComponentType<unknown>, hocs: HigherOrderComponent[]): void;
}

const CompositionContext = createContext<CompositionContext | undefined>(undefined);

export const CompositionProvider: React.FC = ({ children }) => {
    const [components, setComponents] = useState<ComposedComponents>(new Map());

    const composeComponent = useCallback(
        (component, hocs) => {
            setComponents(prevComponents => {
                const components = new Map(prevComponents);
                const recipe = components.get(component) || { component: null, hocs: [] };

                const newHocs = [...(recipe.hocs || []), ...hocs];

                components.set(component, {
                    component: compose(...[...newHocs].reverse())(component),
                    hocs: newHocs
                });

                return components;
            });

            // Return a function that will remove the added HOCs.
            return () => {
                setComponents(prevComponents => {
                    const components = new Map(prevComponents);
                    const recipe = components.get(component) || {
                        component: null,
                        hocs: []
                    };

                    const newHOCs = [...recipe.hocs].filter(hoc => !hocs.includes(hoc));
                    const NewComponent = compose(...[...newHOCs].reverse())(component);

                    components.set(component, {
                        component: NewComponent,
                        hocs: newHOCs
                    });

                    return components;
                });
            };
        },
        [setComponents]
    );

    const getComponent: CompositionContext["getComponent"] = useCallback(
        Component => {
            const composedComponent = components.get(Component);
            return composedComponent ? composedComponent.component : undefined;
        },
        [components]
    );

    const context: CompositionContext = useMemo(
        () => ({
            getComponent,
            composeComponent,
            components
        }),
        [components, composeComponent]
    );

    return <CompositionContext.Provider value={context}>{children}</CompositionContext.Provider>;
};

export function useComponent(Component: ComponentType<any>) {
    const context = useOptionalComposition();

    if (!context) {
        return Component;
    }

    return context.getComponent(Component) || Component;
}

/**
 * This hook will throw an error if composition context doesn't exist.
 */
export function useComposition() {
    const context = useContext(CompositionContext);
    if (!context) {
        throw new Error(
            `You're missing a <CompositionProvider> higher up in your component hierarchy!`
        );
    }

    return context;
}

/**
 * This hook will not throw an error if composition context doesn't exist.
 */
export function useOptionalComposition() {
    return useContext(CompositionContext);
}
