import React from "react";
import { GenericDecorator } from "~/Context";
import { Compose } from "~/Compose";
import { GetDecoratee, GetDecorateeParams } from "~/createComponentPlugin";
import { DecoratableComponent, GenericComponent, GenericHook } from "~/types";

interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator<TDecoratee extends GenericComponent>(
    shouldDecorate: ShouldDecorate,
    decorator: GenericDecorator<TDecoratee>,
    decoratorProps: unknown
): GenericDecorator<TDecoratee> {
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
    }) as GenericDecorator<TDecoratee>;
}

export function createDecoratorFactory<TDecorator>() {
    return function from<TDecoratable extends DecoratableComponent>(
        decoratable: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        return function createDecorator(decorator: GenericDecorator<GetDecoratee<TDecoratable>>) {
            return function DecoratorPlugin(props: TDecorator) {
                if (shouldDecorate) {
                    const componentDecorator = createConditionalDecorator<GenericComponent>(
                        shouldDecorate,
                        decorator as unknown as GenericDecorator<GenericComponent>,
                        props
                    );

                    return <Compose function={decoratable} with={componentDecorator} />;
                }

                return (
                    <Compose
                        function={decoratable}
                        with={decorator as unknown as GenericDecorator<GenericHook>}
                    />
                );
            };
        };
    };
}
