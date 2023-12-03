import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    FunctionComponentElement,
    ReactElement
} from "react";
import { RouteProps, Route } from "@webiny/react-router";
import { compose, CompositionProvider, Decorator } from "@webiny/react-composition";
import { DebounceRender } from "./core/DebounceRender";
import { PluginsProvider } from "./core/Plugins";

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

export interface ContentDecorator {
    (element: ReactElement): ReactElement;
}

export interface AppProps {
    debounceRender?: number;
    routes?: Array<RouteProps>;
    providers?: Array<Decorator>;
    contentDecorator?: ContentDecorator;
    contentElement?: React.ReactNode;
    children?: React.ReactNode | React.ReactNode[];
}

export const App = ({
    debounceRender = 50,
    routes = [],
    providers = [],
    contentDecorator = el => el,
    contentElement = <span>No `contentElement` was configured to render the app!</span>,
    children
}: AppProps) => {
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
                {contentDecorator(
                    <Providers>
                        <PluginsProvider>{state.plugins}</PluginsProvider>
                        <DebounceRender wait={debounceRender}>{contentElement}</DebounceRender>
                    </Providers>
                )}
            </CompositionProvider>
        </AppContext.Provider>
    );
};

App.displayName = "App";
