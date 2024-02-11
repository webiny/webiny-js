import React from "react";
import {DecorateeTypes, Decorator} from "~/Context";
import { Compose } from "~/Compose";
import { DecoratableComponent } from "~/makeDecoratable";
import { GetDecoratee, GetDecorateeParams } from "~/createComponentPlugin";

interface ShouldDecorate<TDecorator = any, TComponent = any> {
    (decoratorProps: TDecorator, componentProps: TComponent): boolean;
}

export function createConditionalDecorator<TDecoratee extends DecorateeTypes>(
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
        Component: TDecoratable,
        shouldDecorate?: ShouldDecorate<TDecorator, GetDecorateeParams<GetDecoratee<TDecoratable>>>
    ) {
        return function createDecorator(decorator: Decorator<GetDecoratee<TDecoratable>>) {
            return function DecoratorPlugin(props: TDecorator) {
                if (shouldDecorate) {
                    const componentDecorator = createConditionalDecorator<GetDecoratee<TDecoratable>>(
                        shouldDecorate,
                        decorator,
                        props
                    );

                    return <Compose component={Component} with={componentDecorator} />;
                }
                return <Compose component={Component} with={decorator} />;
            };
        };
    };
}
