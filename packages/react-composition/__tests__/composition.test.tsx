/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import {
    CompositionProvider,
    createDecorator,
    createDecoratorFactory,
    makeDecoratable
} from "~/index";

interface UseLabelParams {
    lowercase: boolean;
}

interface BaseComponentProps {
    name?: string;
    color?: string;
}

describe("Decoration of Hooks and Components", () => {
    it("should decorate components", async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const BaseComponent = makeDecoratable("BaseComponent", (_: BaseComponentProps) => {
            return <span>BaseComponent</span>;
        });

        const DecorateBaseComponent = createDecorator(
            BaseComponent,
            function BaseComponentDecorator(Original) {
                return function DecoratedBaseComponent() {
                    return (
                        <div>
                            <Original />
                        </div>
                    );
                };
            }
        );

        // Test base component
        {
            const { container } = render(
                <CompositionProvider>
                    <BaseComponent />
                </CompositionProvider>
            );

            expect(container.innerHTML).toEqual("<span>BaseComponent</span>");
        }

        // Test decorator
        {
            const view = (
                <CompositionProvider>
                    <DecorateBaseComponent />
                    <BaseComponent />
                </CompositionProvider>
            );

            const { container } = render(view);

            await waitFor(() =>
                expect(container.innerHTML).toEqual("<div><span>BaseComponent</span></div>")
            );
        }
    });

    it("should decorate hook", async () => {
        const useLabel = makeDecoratable((params?: UseLabelParams) => {
            const label = "Base Label";

            return { label: params?.lowercase ? label.toLowerCase() : label };
        });

        const BaseComponent = () => {
            const { label } = useLabel();

            return <span>{label}</span>;
        };

        const DecorateHook = createDecorator(useLabel, baseHook => {
            return params => {
                return { ...baseHook(params), label: "Decorated Label" };
            };
        });

        // Test base hook
        {
            const { container } = render(
                <CompositionProvider>
                    <BaseComponent />
                </CompositionProvider>
            );

            expect(container.innerHTML).toEqual("<span>Base Label</span>");
        }

        // Test decorated hook
        {
            const view = (
                <CompositionProvider>
                    <DecorateHook />
                    <BaseComponent />
                </CompositionProvider>
            );

            const { container } = render(view);

            await waitFor(() =>
                expect(container.innerHTML).toEqual("<span>Decorated Label</span>")
            );
        }
    });

    it("should apply conditional component decorator", async () => {
        interface CreateDecoratorProps {
            name: string;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const BaseComponent = makeDecoratable("BaseComponent", (_: BaseComponentProps) => {
            return <span>BaseComponent</span>;
        });

        const decoratorFactory = createDecoratorFactory<CreateDecoratorProps>()(
            BaseComponent,
            (decoratorProps, componentProps) => {
                if (decoratorProps.name === "*") {
                    return true;
                }

                return decoratorProps.name === componentProps.name;
            }
        );

        const DecorateBaseComponent = decoratorFactory(Original => {
            return function DecoratedBaseComponent() {
                return (
                    <div>
                        <Original />
                    </div>
                );
            };
        });

        // Test base component
        {
            const { container } = render(
                <CompositionProvider>
                    <BaseComponent />
                </CompositionProvider>
            );

            expect(container.innerHTML).toEqual("<span>BaseComponent</span>");
        }

        // Test conditional decorator
        {
            const view = (
                <CompositionProvider>
                    <DecorateBaseComponent name={"*"} />
                    <BaseComponent name="test" />
                </CompositionProvider>
            );

            const { container } = render(view);

            await waitFor(() =>
                expect(container.innerHTML).toEqual("<div><span>BaseComponent</span></div>")
            );
        }

        // Test conditional decorator
        {
            const view = (
                <CompositionProvider>
                    <DecorateBaseComponent name={"test"} />
                    <BaseComponent name={"test"} />
                </CompositionProvider>
            );

            const { container } = render(view);

            await waitFor(() =>
                expect(container.innerHTML).toEqual("<div><span>BaseComponent</span></div>")
            );
        }

        // Test conditional decorator
        {
            const view = (
                <CompositionProvider>
                    <DecorateBaseComponent name={"mismatch"} />
                    <BaseComponent name={"test"} />
                </CompositionProvider>
            );

            const { container } = render(view);

            await waitFor(() => expect(container.innerHTML).toEqual("<span>BaseComponent</span>"));
        }
    });
});
