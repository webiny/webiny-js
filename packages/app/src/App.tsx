import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
    compose,
    CompositionProvider,
    Decorator,
    DecoratorsCollection,
    GenericComponent
} from "@webiny/react-composition";
import { PluginsProvider } from "./core/Plugins.js";
import { RouterWithConfig, useRouterConfig } from "./config/RouterConfig.js";
import { AppContainer } from "./AppContainer.js";
import { RouteContent } from "~/presentation/router/components/RouteContent.js";
import { useRouter } from "~/router.js";

interface State {
    plugins: React.JSX.Element[];
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
    routes?: Array<any>;
    providers?: Array<Decorator<GenericComponent<ProviderProps>>>;
    decorators?: DecoratorsCollection;
    children?: React.ReactNode | React.ReactNode[];
}

interface ProviderProps {
    children: React.ReactNode;
}

type ComponentWithChildren = React.ComponentType<{ children?: React.ReactNode }>;

export const AppBase = React.memo(({ routes = [], providers = [], children }: AppProps) => {
    const [state, setState] = useState<State>({
        plugins: [],
        providers
    });

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

    const addPlugin = useCallback((element: React.JSX.Element) => {
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
            const router = useRouter();
            const routerConfig = useRouterConfig();
            const routesFromConfig = routerConfig.routes;
            const combinedRoutes = [...routes, ...routesFromConfig];

            useEffect(() => {
                router.setRoutes(combinedRoutes);
            }, [combinedRoutes.length]);

            return null;
        };
    }, []);

    const Providers = useMemo(() => {
        return React.memo(
            compose(...(state.providers || []))(({ children }: ProviderProps) => {
                return <>{children}</>;
            })
        );
    }, [state.providers.length]) as ComponentWithChildren;

    Providers.displayName = "Providers";

    return (
        <AppContext.Provider value={appContext}>
            {children}
            <AppContainer>
                <Providers>
                    <PluginsProvider>{state.plugins}</PluginsProvider>
                    <RouterWithConfig>
                        <AppRouter />
                        <RouteContent />
                    </RouterWithConfig>
                </Providers>
            </AppContainer>
        </AppContext.Provider>
    );
});

AppBase.displayName = "AppBase";

export const App = ({ decorators, ...props }: AppProps) => {
    return (
        <CompositionProvider decorators={decorators}>
            <AppBase decorators={decorators} {...props} />
        </CompositionProvider>
    );
};
