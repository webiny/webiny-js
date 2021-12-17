import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    cloneElement,
    useEffect,
    FunctionComponentElement,
    ComponentType,
    ReactElement,
    Fragment,
    ReactNode
} from "react";
import { BrowserRouter, RouteProps } from "@webiny/react-router";
import { set } from "dot-prop-immutable";
import { Routes as SortRoutes } from "../components/Routes";
import { ApolloClient } from "apollo-client";
import { createApolloProvider } from "./ApolloProvider";
import { createUiStateProvider } from "./UiStateProvider";
import { createTelemetryProvider } from "./TelemetryProvider";

export const compose = (...fns) => {
    return Base => {
        return fns.reduceRight((Component, hoc) => hoc(Component), Base);
    };
};

const AdminContext = createContext(null);
AdminContext.displayName = "AdminContext";

export const useAdmin = () => {
    return useContext(AdminContext);
};

export const Extension = ({ children }: { children: ReactNode | ReactNode[] }) => {
    const { addExtension } = useAdmin();

    useEffect(() => {
        React.Children.forEach(children, child => addExtension(child));
    }, []);

    return null;
};

export interface ProviderProps {
    hoc: HigherOrderComponent;
}

export const Provider = ({ hoc }: ProviderProps) => {
    const { addProvider } = useAdmin();

    useEffect(() => {
        return addProvider(hoc);
    }, []);

    return null;
};

export interface HigherOrderComponent {
    (Component: React.ComponentType<unknown>): React.ComponentType<unknown>;
}

export interface ComposeProps {
    component: React.ComponentType<unknown> & { original: React.ComponentType<unknown> };
    with: HigherOrderComponent | HigherOrderComponent[];
}

export const Compose = (props: ComposeProps) => {
    const { addComponentWrappers } = useAdmin();

    useEffect(() => {
        if (typeof props.component.original === "undefined") {
            console.warn(
                `You must make your component "<${props.component.displayName}>" composable, by using the makeComposable() function!`
            );

            return;
        }

        const hocs = Array.isArray(props.with) ? props.with : [props.with];
        return addComponentWrappers(props.component.original, hocs);
    }, [props.with]);

    return null;
};

const useComponent = Component => {
    const { wrappers } = useAdmin();
    const recipe = wrappers.get(Component);

    if (!recipe) {
        return Component;
    }

    return recipe.component;
};

export function makeComposable<TProps>(name, Component: React.ComponentType<TProps>) {
    const Proxy = (props: TProps & { children?: unknown }) => {
        const WrappedComponent = useComponent(Component);

        return <WrappedComponent {...props}>{props.children}</WrappedComponent>;
    };

    Component.displayName = name;

    Proxy.original = Component;
    Proxy.displayName = `Proxy<${name}>`;

    return Proxy;
}

export const Routes = ({ children }) => {
    const { addRoute } = useAdmin();

    useEffect(() => {
        React.Children.forEach(children, child => {
            addRoute(child);
        });
    }, [children]);

    return null;
};

const MenuContext = createContext(null);
MenuContext.displayName = "MenuContext";

const useMenu = () => {
    return useContext(MenuContext);
};

export interface MenuProps {
    id: string;
    label: string;
    path?: string;
    icon?: JSX.Element;
    onClick?: () => void;
    testId?: string;
    children?: React.ReactNode | React.ReactNode[];
}

export interface MenuData extends MenuProps {
    children: MenuData[];
}

export const Menu = ({ children, ...props }: MenuProps) => {
    const [state, setState] = useState({ ...props, children: [] });
    const admin = useAdmin();
    const menu = useMenu();

    useEffect(() => {
        if (menu) {
            menu.setMenu(state.id, state);
        } else {
            return admin.setMenu(state.id, state);
        }
    }, [state]);

    const context = {
        setMenu(id, props) {
            setState(menu => {
                const childIndex = menu.children.findIndex(ch => ch.id === id);
                if (childIndex === -1) {
                    return {
                        ...menu,
                        children: [...menu.children, { ...props }]
                    };
                }
                return {
                    ...menu,
                    children: set(menu.children, childIndex, curr => ({ ...curr, ...props }))
                };
            });
        }
    };

    if (!children) {
        return null;
    }

    return <MenuContext.Provider value={context}>{children}</MenuContext.Provider>;
};

interface State {
    routes: Record<string, ReactElement<RouteProps>>;
    menus: MenuData[];
    extensions: JSX.Element[];
    wrappers: Map<
        ComponentType<unknown>,
        { component: ComponentType<unknown>; wrappers: HigherOrderComponent[] }
    >;
    providers: HigherOrderComponent[];
}

export interface AdminProps {
    apolloClient: ApolloClient<unknown>;
    children?: React.ReactNode | React.ReactNode[];
}

export const Admin = ({ apolloClient, children }: AdminProps) => {
    const [state, setState] = useState<State>({
        routes: {},
        menus: [],
        extensions: [],
        wrappers: new Map(),
        providers: [
            createTelemetryProvider(),
            createApolloProvider(apolloClient),
            createUiStateProvider()
        ]
    });

    const setMenu = useCallback((id, menu) => {
        setState(state => {
            const index = state.menus.findIndex(m => m.id === id);

            return {
                ...state,
                menus:
                    index > -1
                        ? [...state.menus.slice(0, index), menu, ...state.menus.slice(index + 1)]
                        : [...state.menus, menu]
            };
        });

        // Return a function that will remove the added menu.
        return () => {
            setState(state => {
                const index = state.menus.findIndex(m => m.id === id);

                if (index < 0) {
                    return state;
                }

                return {
                    ...state,
                    menus: [...state.menus.slice(0, index), ...state.menus.slice(index + 1)]
                };
            });
        };
    }, []);

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
            setMenu,
            addRoute,
            addProvider,
            addExtension,
            addComponentWrappers
        }),
        [state]
    );

    const AdminRouter = useMemo(
        () =>
            function AdminRouter({ children }) {
                const routes = Object.values(state.routes);
                return (
                    <Fragment>
                        <SortRoutes key={routes.length} />
                        {children}
                    </Fragment>
                );
            },
        [state.routes]
    );

    const App = useMemo(
        () => compose(...(state.providers || []))(AdminRouter),
        [state.providers, AdminRouter]
    );

    App.displayName = "AdminAppRenderer";

    return (
        <AdminContext.Provider value={adminContext}>
            <BrowserRouter>
                {children}
                <App>{state.extensions.map((ext, key) => cloneElement(ext, { key }))}</App>
            </BrowserRouter>
        </AdminContext.Provider>
    );
};

Admin.displayName = "Admin";
