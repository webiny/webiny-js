import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    FunctionComponentElement,
    ReactElement,
    useRef
} from "react";
import { createBrowserHistory } from "history";
import { RouteProps, Route, Router, RouteContent, BrowserRouter } from "@webiny/react-router";
import { compose, CompositionProvider, Decorator } from "@webiny/react-composition";
import { DebounceRender } from "./core/DebounceRender";
import { PluginsProvider } from "./core/Plugins";
import { plugins } from "@webiny/plugins";
import { RoutePlugin } from "~/plugins/RoutePlugin";

type RoutesByPath = {
    [key: string]: ReactElement<RouteProps>;
};

interface State {
    routes: RoutesByPath;
    plugins: JSX.Element[];
    providers: Decorator[];
}

interface AppContext extends State {
    addRoute(route: JSX.Element): void;
    addProvider(hoc: Decorator): void;
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

type RouteDefinitions = React.ComponentProps<typeof Router>["routes"];

const normalizeRoutes = (routes: FunctionComponentElement<RouteProps>[]): RouteDefinitions => {
    return routes.filter(Boolean).map(route => {
        return {
            name: route.props.path,
            path: route.props.path,
            element: route.props.element || route.props.children || route.props.render
        };
    }) as RouteDefinitions;
};

export interface AppProps {
    debounceRender?: number;
    routes?: Array<RouteProps>;
    providers?: Array<Decorator>;
    children?: React.ReactNode | React.ReactNode[];
}

export const App = ({ debounceRender = 50, routes = [], providers = [], children }: AppProps) => {
    const [state, setState] = useState<State>({
        routes: routes.reduce<RoutesByPath>((acc, item) => {
            return { ...acc, [item.path as string]: <Route {...item} /> };
        }, {}),
        plugins: [],
        providers
    });

    const history = useRef(createBrowserHistory());

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
            if (state.providers.findIndex(m => m === component) > -1) {
                return state;
            }

            return {
                ...state,
                providers: [...state.providers, component]
            };
        });
    }, []);

    const addPlugin = useCallback(element => {
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

    const routesFromPlugins = plugins.byType<RoutePlugin>("route").map(({ route }) => route);
    const allRoutes = normalizeRoutes([
        ...Object.values(state.routes),
        ...routesFromPlugins
    ] as FunctionComponentElement<RouteProps>[]);

    const Providers = useMemo(() => {
        return compose(...(state.providers || []))(({ children }: any) => (
            <DebounceRender wait={debounceRender}>{children}</DebounceRender>
        ));
    }, [state.providers.length]);

    Providers.displayName = "Providers";

    return (
        <AppContext.Provider value={appContext}>
            <CompositionProvider>
                {children}
                <BrowserRouter history={history.current}>
                    <Router routes={allRoutes} history={history.current} getBaseUrl={() => ""}>
                        <Providers>
                            <PluginsProvider>{state.plugins}</PluginsProvider>
                            <DebounceRender wait={debounceRender}>
                                <RouteContent />
                            </DebounceRender>
                        </Providers>
                    </Router>
                </BrowserRouter>
            </CompositionProvider>
        </AppContext.Provider>
    );
};

App.displayName = "App";
