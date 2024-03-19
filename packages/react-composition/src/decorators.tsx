import React from "react";
import { Compose } from "~/Compose";
import { GetDecoratee, GetDecorateeParams } from "~/createDecorator";
import { DecoratableComponent, GenericComponent, Decorator } from "~/types";

interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator<TDecoratee extends GenericComponent>(
    shouldDecorate: ShouldDecorate,
    decorator: Decorator<TDecoratee>,
    decoratorProps: unknown
): Decorator<TDecoratee> {
    return (Original => {
        const DecoratedComponent = decorator(Original);

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

const defaultShouldDecorate = () => true;

export function createDecoratorFactory<TDecorator>() {
    return function from<TDecoratable extends DecoratableComponent>(
        decoratable: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        return function createDecorator(decorator: Decorator<GetDecoratee<TDecoratable>>) {
            return function DecoratorPlugin(props: TDecorator) {
                const componentDecorator = createConditionalDecorator<GenericComponent>(
                    shouldDecorate || defaultShouldDecorate,
                    decorator as unknown as Decorator<GenericComponent>,
                    props
                );

                return <Compose function={decoratable} with={componentDecorator} />;
            };
        };
    };
}
