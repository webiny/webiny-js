/**
 * @jest-environment jsdom
 */
/* eslint-disable */
import React from "react";
import { makeDecoratable, withDecoratorFactory } from "~/index";

interface BaseComponentProps {
    name?: string;
    color?: string;
}

describe("Built-in decorator factory", () => {
    it("with external augmentation", async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const BaseComponent = makeDecoratable("BaseComponent", (_: BaseComponentProps) => {
            return <span>BaseComponent</span>;
        });

        const WithDefaultDecorator = withDecoratorFactory<{ name: string }>()(BaseComponent);

        const GenericComponentDecorator = WithDefaultDecorator.createDecorator(Original => {
            return function GenericComponentDecorator(props) {
                return <Original {...props} />;
            };
        });

        <GenericComponentDecorator name={"*"} />;

        const FinalComponent = withDecoratorFactory<{ modelIds?: string[] }>()(BaseComponent);

        const CustomComponentDecorator = FinalComponent.createDecorator(Original => {
            return function CustomComponentDecorator(props) {
                return <Original {...props} />;
            };
        });

        <CustomComponentDecorator modelIds={["model1"]} />;
    });

    it("with built-in augmentation", async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const WithDefaultDecorator = withDecoratorFactory<{ name: string }>()(
            makeDecoratable("BaseComponent", (_: BaseComponentProps) => {
                return <span>BaseComponent</span>;
            })
        );

        const GenericComponentDecorator = WithDefaultDecorator.createDecorator(Original => {
            return function GenericComponentDecorator(props) {
                return <Original {...props} />;
            };
        });

        <GenericComponentDecorator name={"123"} />;

        const FinalComponent = withDecoratorFactory<{ modelIds?: string[] }>()(
            WithDefaultDecorator
        );

        const CustomComponentDecorator = FinalComponent.createDecorator(Original => {
            return function CustomComponentDecorator(props) {
                return <Original {...props} />;
            };
        });

        <CustomComponentDecorator modelIds={["*"]} />;
    });
});
