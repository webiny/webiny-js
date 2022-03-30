import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    useCallback,
    FC,
    FunctionComponentElement,
    ComponentType,
    ReactElement
} from "react";
import { BrowserRouter, RouteProps } from "@webiny/react-router";
import { Routes as SortRoutes } from "./components/utils/Routes";
import { DebounceRender } from "./components/utils/DebounceRender";
import { PluginsProvider } from "./components/core/Plugins";

function compose(...fns: HigherOrderComponent[]) {
    return function ComposedComponent(Base: FC<unknown>): FC<unknown> {
        return fns.reduceRight((Component, hoc) => hoc(Component), Base);
    };
}

interface Wrapper {
    component: ComponentType<unknown>;
    wrappers: HigherOrderComponent[];
}
interface State {
    routes: Record<string, ReactElement<RouteProps>>;
    plugins: JSX.Element[];
    wrappers: Map<ComponentType<unknown>, Wrapper>;
    providers: HigherOrderComponent[];
}

interface AdminContext extends State {
    addRoute(route: JSX.Element): void;
    addProvider(hoc: HigherOrderComponent): void;
    addPlugin(plugin: React.ReactNode): void;
    addComponentWrappers(
        component: React.ComponentType<unknown>,
        hocs: HigherOrderComponent[]
    ): void;
}

const AdminContext = createContext<AdminContext>({
    routes: {},
    plugins: [],
    wrappers: new Map(),
    providers: [],
    addComponentWrappers: () => {
        return void 0;
    },
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

/**
 * IMPORTANT: TInputProps default type is `any` because this interface is use as a prop type in the `Compose` component.
 * You can pass any HigherOrderComponent as a prop, regardless of its TInputProps type. The only way to allow that is
 * to let it be `any` in this interface.
 */
export interface HigherOrderComponent<TInputProps = any, TOutputProps = TInputProps> {
    (Component: FC<TInputProps>): FC<TOutputProps>;
}

export interface AdminProps {
    children?: React.ReactNode | React.ReactNode[];
}

export const Admin = ({ children }: AdminProps) => {
    const [state, setState] = useState<State>({
        routes: {},
        plugins: [],
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
                const recipe = wrappers.get(component) || { component: null, wrappers: [] };

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
            addPlugin,
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
        () => compose(...(state.providers || []))(DebounceRender),
        [state.providers]
    );

    Providers.displayName = "Providers";

    return (
        <AdminContext.Provider value={adminContext}>
            {children}
            <BrowserRouter>
                <Providers>
                    <PluginsProvider>{state.plugins}</PluginsProvider>
                    <DebounceRender>
                        <AdminRouter />
                    </DebounceRender>
                </Providers>
            </BrowserRouter>
        </AdminContext.Provider>
    );
};

Admin.displayName = "Admin";
