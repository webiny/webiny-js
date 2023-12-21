import React, { createContext, useContext, useMemo, useState } from "react";
import { ComponentWithChildren } from "~/types";

export interface ViewElement {
    name: string;
    elements: JSX.Element[];
    label?: string;
    [key: string]: any;
}

interface ElementSetter {
    (element: ViewElement): ViewElement;
}

export interface ViewCompositionContext {
    getViewElement(view: string, name: string): ViewElement | null;
    setViewElement(view: string, name: string, setter: ElementSetter): void;
}

const ViewCompositionContext = createContext<ViewCompositionContext>({
    getViewElement: () => {
        return null;
    },
    setViewElement: () => {
        return void 0;
    }
});
ViewCompositionContext.displayName = "ViewCompositionContext";

interface ViewCompositionProviderState {
    [key: string]: Record<string, any>;
}
interface ViewCompositionProviderProps {
    children: React.ReactNode;
}
const ViewCompositionProvider = ({ children }: ViewCompositionProviderProps) => {
    const [state, setState] = useState<ViewCompositionProviderState>({});

    const context = useMemo(
        () => ({
            getViewElement(view: string, name: string): ViewElement {
                return state[view] && state[view][name];
            },
            setViewElement(view: string, name: string, setter: ElementSetter) {
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

interface ViewCompositionProviderHOCProps {
    children: React.ReactNode;
}

export const createViewCompositionProvider = () => (Component: ComponentWithChildren) => {
    return function ViewCompositionProviderHOC({ children }: ViewCompositionProviderHOCProps) {
        return (
            <ViewCompositionProvider>
                <Component>{children}</Component>
            </ViewCompositionProvider>
        );
    };
};
