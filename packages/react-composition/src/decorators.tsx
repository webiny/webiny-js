import React from "react";
import { Decorator } from "~/Context";
import { ComposableFC, Compose } from "~/Compose";

interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator(
    shouldDecorate: ShouldDecorate,
    decorator: Decorator,
    decoratorProps: unknown
): Decorator {
    return (Original: React.ComponentType) => {
        return function ShouldDecorate(props) {
            if (shouldDecorate(decoratorProps, props)) {
                const Component = decorator(Original);
                return <Component {...props} />;
            }

            return <Original {...props} />;
        };
    };
}

export function createDecoratorFactory<TDecorator>() {
    return function from<TComponent>(
        Component: ComposableFC<TComponent>,
        shouldDecorate?: ShouldDecorate<TDecorator, TComponent>
    ) {
        return function createDecorator(decorator: Decorator<TComponent>) {
            return function DecoratorPlugin(props: TDecorator) {
                if (shouldDecorate) {
                    return (
                        <Compose
                            component={Component}
                            with={createConditionalDecorator(shouldDecorate, decorator, props)}
                        />
                    );
                }
                return <Compose component={Component} with={decorator} />;
            };
        };
    };
}
