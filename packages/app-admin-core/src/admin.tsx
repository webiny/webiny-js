import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    FunctionComponentElement,
    ReactElement
} from "react";
import { BrowserRouter, RouteProps } from "@webiny/react-router";
import { compose, HigherOrderComponent, CompositionProvider } from "@webiny/react-composition";
import { Routes as SortRoutes } from "./components/utils/Routes";
import { DebounceRender } from "./components/utils/DebounceRender";
import { PluginsProvider } from "./components/core/Plugins";

interface State {
    routes: Record<string, ReactElement<RouteProps>>;
    plugins: JSX.Element[];
    providers: HigherOrderComponent[];
}

interface AdminContext extends State {
    addRoute(route: JSX.Element): void;
    addProvider(hoc: HigherOrderComponent): void;
    addPlugin(plugin: React.ReactNode): void;
}

const AdminContext = createContext<AdminContext>({
    routes: {},
    plugins: [],
    providers: [],
    addPlugin: () => {
        return void 0;
    },
    addProvider: () => {
        return void 0;
    },
    addRoute: () => {
        return void 0;
    }
});
AdminContext.displayName = "AdminContext";

export const useAdmin = () => {
    return useContext(AdminContext);
};

export interface AdminProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const Admin = ({ children }: AdminProps) => {
    const [state, setState] = useState<State>({
        routes: {},
        plugins: [],
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

    const adminContext = useMemo(
        () => ({
            ...state,
            addRoute,
            addProvider,
            addPlugin
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
        () => compose(...(state.providers || []))(DebounceRender),
        [state.providers]
    );

    Providers.displayName = "Providers";

    return (
        <AdminContext.Provider value={adminContext}>
            <CompositionProvider>
                {children}
                <BrowserRouter>
                    <Providers>
                        <PluginsProvider>{state.plugins}</PluginsProvider>
                        <DebounceRender>
                            <AdminRouter />
                        </DebounceRender>
                    </Providers>
                </BrowserRouter>
            </CompositionProvider>
        </AdminContext.Provider>
    );
};

Admin.displayName = "Admin";
