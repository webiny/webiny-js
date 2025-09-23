import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from "react";
import { createBrowserHistory } from "history";
import { BrowserRouter, RouteProps, Route, Router } from "@webiny/react-router";
import {
    CompositionProvider,
    GenericComponent,
    compose,
    Decorator,
    DecoratorsCollection
} from "@webiny/react-composition";
import { Routes as SortRoutes } from "./core/Routes.js";
import { DebounceRender } from "./core/DebounceRender.js";
import { PluginsProvider } from "./core/Plugins.js";
import { RouterWithConfig, useRouterConfig } from "./config/RouterConfig.js";
import { AppContainer } from "./AppContainer.js";

interface State {
    plugins: JSX.Element[];
    providers: Decorator<GenericComponent<ProviderProps>>[];
}

interface AppContext extends State {
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
    decorators?: DecoratorsCollection;
    children?: React.ReactNode | React.ReactNode[];
}

interface ProviderProps {
    children: React.ReactNode;
}

type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;

export const AppBase = ({
    debounceRender = 50,
    routes = [],
    providers = [],
    children
}: AppProps) => {
    const [state, setState] = useState<State>({
        plugins: [],
        providers
    });

    const history = useRef(createBrowserHistory());

    const addProvider = useCallback((component: Decorator<any>) => {
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
            addProvider,
            addPlugin
        }),
        [state]
    );

    const AppRouter = useMemo(() => {
        return function AppRouter() {
            // TODO: no need to mount `<Route>` components - I can just set routes programmatically!
            const routerConfig = useRouterConfig();
            const combinedRoutes = [...routes, ...routerConfig.routes].map(r => {
                return (
                    <Route name={r.name ?? r.path} path={r.path} element={r.element} key={r.path} />
                );
            });

            return <SortRoutes key={routes.length} routes={combinedRoutes} />;
        };
    }, [routes]);

    const Providers = useMemo(() => {
        return React.memo(
            compose(...(state.providers || []))(({ children }: ProviderProps) => {
                return <DebounceRender wait={debounceRender}>{children}</DebounceRender>;
            })
        );
    }, [state.providers.length]) as ComponentWithChildren;

    Providers.displayName = "Providers";

    return (
        <AppContext.Provider value={appContext}>
            {children}
            <AppContainer>
                <BrowserRouter>
                    <Router history={history.current} getBaseUrl={() => ""}>
                        <Providers>
                            <PluginsProvider>{state.plugins}</PluginsProvider>
                            <DebounceRender wait={debounceRender}>
                                <RouterWithConfig>
                                    <AppRouter />
                                </RouterWithConfig>
                            </DebounceRender>
                        </Providers>
                    </Router>
                </BrowserRouter>
            </AppContainer>
        </AppContext.Provider>
    );
};

export const App = ({ decorators, ...props }: AppProps) => {
    return (
        <CompositionProvider decorators={decorators}>
            <AppBase decorators={decorators} {...props} />
        </CompositionProvider>
    );
};
