import React, { createContext, useContext, useMemo } from "react";
import type { ErrorInfo } from "react";
import { useComponent } from "./Context.js";
import type {
    DecoratableComponent,
    DecoratableHook,
    GenericComponent,
    GenericHook
} from "~/types.js";
import { withDecoratorFactory, withHookDecoratorFactory } from "~/decorators.js";

interface ErrorBoundaryProps {
    name: string;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | undefined;
}

class DecoratableErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.groupCollapsed(
            `%cCOMPONENT ERROR%c: "${this.props.name}" failed to render.`,
            "color:red",
            "color:default"
        );
        console.error(error, errorInfo);
        console.groupEnd();
    }

    override render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: "8px 12px",
                        border: "1px solid #e53e3e",
                        borderRadius: 4,
                        background: "#fff5f5",
                        color: "#c53030",
                        fontSize: 13
                    }}
                >
                    <strong>{this.props.name}</strong>: {this.state.error?.message}
                </div>
            );
        }
        return this.props.children;
    }
}

const ComposableContext = createContext<string[]>([]);
ComposableContext.displayName = "ComposableContext";

function useComposableParents() {
    const context = useContext(ComposableContext);
    if (!context) {
        return [];
    }

    return context;
}

const nullRenderer = () => null;

function makeDecoratableComponent<T extends GenericComponent>(
    name: string,
    Component: T = nullRenderer as unknown as T
) {
    const Decoratable = (props: React.ComponentProps<T>): JSX.Element | null => {
        const parents = useComposableParents();
        const ComposedComponent = useComponent(Component) as GenericComponent<
            React.ComponentProps<T>
        >;

        const context = useMemo(() => [...parents, name], [parents, name]);

        return (
            <ComposableContext.Provider value={context}>
                <DecoratableErrorBoundary name={name}>
                    <ComposedComponent {...props}>{props.children}</ComposedComponent>
                </DecoratableErrorBoundary>
            </ComposableContext.Provider>
        );
    };

    const staticProps = {
        original: Component,
        originalName: name,
        displayName: `Decoratable<${name}>`
    };

    return withDecoratorFactory()(
        Object.assign(Decoratable, staticProps) as DecoratableComponent<
            typeof Component & typeof staticProps
        >
    );
}

export function makeDecoratableHook<T extends GenericHook>(hook: T) {
    const decoratableHook = (params: Parameters<T>) => {
        const composedHook = useComponent(hook);

        return composedHook(params) as DecoratableHook<T>;
    };

    decoratableHook.original = hook;

    return withHookDecoratorFactory()(decoratableHook as DecoratableHook<T>);
}

export function createVoidComponent<T>() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (props: T): JSX.Element | null => {
        return null;
    };
}

export function makeDecoratable<T extends GenericHook>(
    hook: T
): ReturnType<typeof makeDecoratableHook<T>>;
export function makeDecoratable<T extends GenericComponent>(
    name: string,
    Component: T
): ReturnType<typeof makeDecoratableComponent<T>>;
export function makeDecoratable(hookOrName: any, Component?: any) {
    if (Component) {
        const component = makeDecoratableComponent(hookOrName, React.memo(Component));
        component.original.displayName = hookOrName;
        return component;
    }

    return makeDecoratableHook(hookOrName);
}
