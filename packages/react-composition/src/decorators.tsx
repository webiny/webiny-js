import React from "react";
import { Compose } from "~/Compose";
import { GetDecoratee, GetDecorateeParams } from "~/createDecorator";
import {
    DecoratableComponent,
    GenericComponent,
    Decorator,
    GenericHook,
    DecoratableHook,
    ComponentDecorator
} from "~/types";

export interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator<TDecoratee extends GenericComponent>(
    shouldDecorate: ShouldDecorate,
    decorator: Decorator<TDecoratee>,
    decoratorProps: unknown
): Decorator<TDecoratee> {
    return (Original => {
        const DecoratedComponent = React.memo(decorator(Original));
        DecoratedComponent.displayName = Original.displayName;

        return function ShouldDecorate(props: unknown) {
            if (shouldDecorate(decoratorProps, props)) {
                // @ts-expect-error
                return <DecoratedComponent {...props} />;
            }

            // @ts-expect-error
            return <Original {...props} />;
        };
    }) as Decorator<TDecoratee>;
}

const memoizedComponent = <T extends GenericComponent>(decorator: Decorator<T>) => {
    return (decoratee: T) => {
        return React.memo(decorator(decoratee));
    };
};

export function createDecoratorFactory<TDecorator>() {
    return function from<TDecoratable extends DecoratableComponent>(
        decoratable: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        return function createDecorator(decorator: ComponentDecorator<GetDecoratee<TDecoratable>>) {
            return function DecoratorPlugin(props: TDecorator) {
                if (shouldDecorate) {
                    const componentDecorator = createConditionalDecorator<GenericComponent>(
                        shouldDecorate,
                        decorator as unknown as Decorator<GenericComponent>,
                        props
                    );

                    return <Compose function={decoratable} with={componentDecorator} />;
                }

                return (
                    <Compose
                        function={decoratable}
                        with={memoizedComponent(
                            decorator as unknown as Decorator<GenericComponent>
                        )}
                    />
                );
            };
        };
    };
}

export function createHookDecoratorFactory() {
    return function from<TDecoratable extends DecoratableHook>(decoratable: TDecoratable) {
        return function createDecorator(decorator: Decorator<GetDecoratee<TDecoratable>>) {
            return function DecoratorPlugin() {
                return (
                    <Compose
                        function={decoratable}
                        with={decorator as unknown as Decorator<GenericHook>}
                    />
                );
            };
        };
    };
}

export function withDecoratorFactory<TDecorator>() {
    return function WithDecorator<TDecoratable extends DecoratableComponent>(
        Component: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        const createDecorator = createDecoratorFactory<TDecorator>()(Component, shouldDecorate);

        return Object.assign(Component, { createDecorator }) as TDecoratable & {
            createDecorator: typeof createDecorator;
        };
    };
}

export function withHookDecoratorFactory() {
    return function WithHookDecorator<TDecoratable extends DecoratableHook>(hook: TDecoratable) {
        const createDecorator = createHookDecoratorFactory()(hook);

        return Object.assign(hook, { createDecorator }) as unknown as DecoratableHook<
            GenericHook<
                GetDecorateeParams<GetDecoratee<TDecoratable>>,
                ReturnType<GetDecoratee<TDecoratable>>
            >
        > & { createDecorator: typeof createDecorator };
    };
}
