import React from "react";
import { Compose } from "~/Compose";
import { GetDecoratee, GetDecorateeParams } from "~/createComponentPlugin";
import { DecoratableComponent, GenericComponent, GenericHook, Decorator } from "~/types";

interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator<TDecoratee extends GenericComponent>(
    shouldDecorate: ShouldDecorate,
    decorator: Decorator<TDecoratee>,
    decoratorProps: unknown
): Decorator<TDecoratee> {
    return (Original => {
        return function ShouldDecorate(props: unknown) {
            if (shouldDecorate(decoratorProps, props)) {
                const Component = decorator(Original);
                // @ts-expect-error
                return <Component {...props} />;
            }

            // @ts-expect-error
            return <Original {...props} />;
        };
    }) as Decorator<TDecoratee>;
}

export function createDecoratorFactory<TDecorator>() {
    return function from<TDecoratable extends DecoratableComponent>(
        decoratable: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        return function createDecorator(decorator: Decorator<GetDecoratee<TDecoratable>>) {
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
                        with={decorator as unknown as Decorator<GenericHook>}
                    />
                );
            };
        };
    };
}
