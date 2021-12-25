import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    cloneElement,
    FunctionComponentElement,
    ComponentType,
    ReactElement
} from "react";
import { BrowserRouter, RouteProps } from "@webiny/react-router";
import { Routes as SortRoutes } from "./components/internal/Routes";
import { ExtensionsProvider } from "./components/core/Extensions";

const compose = (...fns) => {
    return Base => {
        return fns.reduceRight((Component, hoc) => hoc(Component), Base);
    };
};

interface AdminContext extends State {
    addRoute(route: JSX.Element): void;
    addProvider(hoc: HigherOrderComponent): void;
    addExtension(extension: React.ReactNode): void;
    addComponentWrappers(
        component: React.ComponentType<unknown>,
        hocs: HigherOrderComponent[]
    ): void;
}

const AdminContext = createContext<AdminContext>(null);
AdminContext.displayName = "AdminContext";

export const useAdmin = () => {
    return useContext(AdminContext);
};

export interface HigherOrderComponent<TInputProps = unknown, TOutputProps = TInputProps> {
    (Component: React.ComponentType<TInputProps>): React.ComponentType<TOutputProps>;
}

interface State {
    routes: Record<string, ReactElement<RouteProps>>;
    extensions: JSX.Element[];
    wrappers: Map<
        ComponentType<unknown>,
        { component: ComponentType<unknown>; wrappers: HigherOrderComponent[] }
    >;
    providers: HigherOrderComponent[];
}

export interface AdminProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const Admin = ({ children }: AdminProps) => {
    const [state, setState] = useState<State>({
        routes: {},
        extensions: [],
        wrappers: new Map(),
        providers: []
    });

    const addRoute = useCallback((route: FunctionComponentElement<RouteProps>) => {
        setState(state => {
            return {
                ...state,
                routes: { ...state.routes, [route.props.path as string]: route }
            };
        });
    }, []);

    const addProvider = useCallback(component => {
        setState(state => {
            return {
                ...state,
                providers: [...state.providers, component]
            };
        });

        // Return a function that will remove the added provider.
        return () => {
            setState(state => {
                const index = state.providers.findIndex(m => m === component);

                if (index < 0) {
                    return state;
                }

                return {
                    ...state,
                    providers: [
                        ...state.providers.slice(0, index),
                        ...state.providers.slice(index + 1)
                    ]
                };
            });
        };
    }, []);

    const addExtension = useCallback(element => {
        setState(state => {
            return {
                ...state,
                extensions: [...state.extensions, element]
            };
        });
    }, []);

    const addComponentWrappers = useCallback((component, hocs) => {
        setState(state => {
            const wrappers = new Map(state.wrappers);
            const recipe = wrappers.get(component) || { component: null, wrappers: [] };

            const newHOCs = [...(recipe.wrappers || []), ...hocs];
            const NewComponent = compose(...[...newHOCs].reverse())(component);

            wrappers.set(component, {
                component: NewComponent,
                wrappers: newHOCs
            });
            return { ...state, wrappers };
        });

        // Return a function that will remove the added HOCs.
        return () => {
            setState(state => {
                const wrappers = new Map(state.wrappers);
                const recipe = wrappers.get(component);

                const newHOCs = [...recipe.wrappers].filter(hoc => !hocs.includes(hoc));
                const NewComponent = compose(...[...newHOCs].reverse())(component);

                wrappers.set(component, {
                    component: NewComponent,
                    wrappers: newHOCs
                });
                return { ...state, wrappers };
            });
        };
    }, []);

    const adminContext = useMemo(
        () => ({
            ...state,
            addRoute,
            addProvider,
            addExtension,
            addComponentWrappers
        }),
        [state]
    );

    const AdminRouter = useMemo(
        () =>
            function AdminRouter() {
                const routes = Object.values(state.routes);
                return <SortRoutes key={routes.length} routes={routes} />;
            },
        [state.routes]
    );

    const Providers = useMemo(
        () => compose(...(state.providers || []))(({ children }) => children),
        [state.providers]
    );

    Providers.displayName = "Providers";

    return (
        <AdminContext.Provider value={adminContext}>
            <BrowserRouter>
                {children}
                <Providers>
                    <ExtensionsProvider>
                        {state.extensions.map((ext, key) => cloneElement(ext, { key }))}
                    </ExtensionsProvider>
                    <AdminRouter />
                </Providers>
            </BrowserRouter>
        </AdminContext.Provider>
    );
};

Admin.displayName = "Admin";
