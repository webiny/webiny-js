import React, { createContext, useContext, useMemo, useState } from "react";

export interface ViewElement {
    name: string;
    elements: JSX.Element[];
    [key: string]: any;
}

interface ElementSetter {
    (element: ViewElement): ViewElement;
}

export interface ViewCompositionContext {
    getViewElement(view: string, name: string): ViewElement;
    setViewElement(view: string, name: string, setter: ElementSetter);
}

const ViewCompositionContext = createContext<ViewCompositionContext>(null);
ViewCompositionContext.displayName = "ViewCompositionContext";

const ViewCompositionProvider = ({ children }) => {
    const [state, setState] = useState({});

    const context = useMemo(
        () => ({
            getViewElement(view: string, name: string): ViewElement {
                return state[view] && state[view][name];
            },
            setViewElement(view, name, setter) {
                setState(state => {
                    const existing = state[view] && state[view][name];
                    return {
                        ...state,
                        [view]: {
                            ...state[view],
                            [name]: setter(existing)
                        }
                    };
                });
            }
        }),
        [state]
    );

    return (
        <ViewCompositionContext.Provider value={context}>
            {children}
        </ViewCompositionContext.Provider>
    );
};

export function useViewComposition() {
    return useContext(ViewCompositionContext);
}

export const createViewCompositionProvider = () => (Component: React.ComponentType<unknown>) => {
    return function ViewCompositionProviderHOC({ children }) {
        return (
            <ViewCompositionProvider>
                <Component>{children}</Component>
            </ViewCompositionProvider>
        );
    };
};
