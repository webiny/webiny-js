import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    FunctionComponentElement,
    ReactElement
} from "react";
import { BrowserRouter, RouteProps, Route } from "@webiny/react-router";
import {
    CompositionProvider,
    GenericComponent,
    compose,
    Decorator,
    HigherOrderComponent
} from "@webiny/react-composition";
import { Routes as SortRoutes } from "./core/Routes";
import { DebounceRender } from "./core/DebounceRender";
import { PluginsProvider } from "./core/Plugins";

type RoutesByPath = {
    [key: string]: ReactElement<RouteProps>;
};

interface State {
    routes: RoutesByPath;
    plugins: JSX.Element[];
    providers: Decorator<GenericComponent<ProviderProps>>[];
}

interface AppContext extends State {
    addRoute(route: JSX.Element): void;
    addProvider(hoc: Decorator<GenericComponent<ProviderProps>>): void;
    addPlugin(plugin: React.ReactNode): void;
}

const AppContext = createContext<AppContext | undefined>(undefined);

AppContext.displayName = "AppContext";

export const useApp = () => {
    const appContext = useContext(AppContext);
    if (!appContext) {
        throw Error(
            `AppContext provider was not found. Are you using the "useApp()" hook in the right place?`
        );
    }
    return appContext;
};

export interface AppProps {
    debounceRender?: number;
    routes?: Array<RouteProps>;
    providers?: Array<Decorator<GenericComponent<ProviderProps>>>;
    children?: React.ReactNode | React.ReactNode[];
}

interface ProviderProps {
    children: React.ReactNode;
}

type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;

export const App = ({ debounceRender = 50, routes = [], providers = [], children }: AppProps) => {
    const [state, setState] = useState<State>({
        routes: routes.reduce<RoutesByPath>((acc, item) => {
            return { ...acc, [item.path as string]: <Route {...item} /> };
        }, {}),
        plugins: [],
        providers
    });

    const addRoute = useCallback((route: FunctionComponentElement<RouteProps>) => {
        setState(state => {
            return {
                ...state,
                routes: { ...state.routes, [route.props.path as string]: route }
            };
        });
    }, []);

    const addProvider = useCallback((component: HigherOrderComponent<any, any>) => {
        setState(state => {
            if (state.providers.findIndex(m => m === component) > -1) {
                return state;
            }

            return {
                ...state,
                providers: [...state.providers, component]
            };
        });
    }, []);

    const addPlugin = useCallback((element: JSX.Element) => {
        setState(state => {
            return {
                ...state,
                plugins: [...state.plugins, element]
            };
        });
    }, []);

    const appContext = useMemo(
        () => ({
            ...state,
            addRoute,
            addProvider,
            addPlugin
        }),
        [state]
    );

    const AppRouter = useMemo(() => {
        return function AppRouter() {
            const routes = Object.values(state.routes);
            return <SortRoutes key={routes.length} routes={routes} />;
        };
    }, [state.routes]);

    const Providers = useMemo(() => {
        return compose(...(state.providers || []))(({ children }: ProviderProps) => {
            return <DebounceRender wait={debounceRender}>{children}</DebounceRender>;
        });
    }, [state.providers.length]) as ComponentWithChildren;

    Providers.displayName = "Providers";

    return (
        <AppContext.Provider value={appContext}>
            <CompositionProvider>
                {children}
                <BrowserRouter>
                    <Providers>
                        <PluginsProvider>{state.plugins}</PluginsProvider>
                        <DebounceRender wait={debounceRender}>
                            <AppRouter />
                        </DebounceRender>
                    </Providers>
                </BrowserRouter>
            </CompositionProvider>
        </AppContext.Provider>
    );
};

App.displayName = "App";
