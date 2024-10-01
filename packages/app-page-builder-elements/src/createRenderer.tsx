import React, { useMemo } from "react";
import { Theme, StylesObject } from "@webiny/theme/types";
import { CSSObject, ClassNames } from "@emotion/react";
import { GenericComponent, makeDecoratable } from "@webiny/react-composition";
import { usePageElements } from "~/hooks/usePageElements";
import { Renderer, Element } from "~/types";
import { RendererProvider } from "~/contexts/Renderer";
import { ElementInput, ElementInputs, ElementInputValues } from "~/inputs/ElementInput";
import { ElementRendererInputs } from "~/contexts/ElementRendererInputs";

interface GetStylesParams {
    theme: Theme;
    element: Element;
}

export type CreateRendererOptions<
    TRenderComponentProps,
    TInputs = Record<string, ElementInput>
> = Partial<{
    propsAreEqual: (
        prevProps: TRenderComponentProps & Inputs<TInputs>,
        nextProps: TRenderComponentProps & Inputs<TInputs>
    ) => boolean;
    themeStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    baseStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    inputs: TInputs;
}>;

const DEFAULT_RENDERER_STYLES: StylesObject = {
    display: "block",
    position: "relative",
    width: "100%",
    boxSizing: "border-box"
};

const EMPTY_OBJECT = {};

export type Inputs<T> = {
    inputs?: { [K in keyof T]?: T[K] extends ElementInput<infer P> ? P : never };
};

type DecoratableComponent<T extends GenericComponent> = ReturnType<typeof makeDecoratable<T>>;

export function createRenderer<
    TRenderComponentProps = Record<string, any>,
    TInputs extends ElementInputs = ElementInputs
>(
    RendererComponent: React.FunctionComponent<TRenderComponentProps>,
    options: CreateRendererOptions<TRenderComponentProps, TInputs> = {}
): DecoratableComponent<Renderer<TRenderComponentProps & Inputs<TInputs>>> & {
    Component: DecoratableComponent<typeof RendererComponent>;
    inputs?: TInputs;
} {
    // We need to make the renderer component decoratable, to allow developers to conditionally render different
    // output depending on the renderer inputs.
    const DecoratableRendererComponent = makeDecoratable(
        "DecoratableRendererComponent",
        RendererComponent
    );

    function ConcreteRenderer(
        props: React.ComponentProps<Renderer<TRenderComponentProps & Inputs<TInputs>>>
    ) {
        const {
            getElementStyles,
            getStyles,
            getElementAttributes,
            theme,
            beforeRenderer,
            afterRenderer
        } = usePageElements();

        // We can't render anything if `theme` is not available.
        if (!theme) {
            return null;
        }

        const { element, meta, inputs, ...componentProps } = props;
        const attributes = getElementAttributes(element);

        const styles: CSSObject[] = [DEFAULT_RENDERER_STYLES];

        if (options.baseStyles) {
            let baseStylesObject = options.baseStyles;
            if (typeof baseStylesObject === "function") {
                baseStylesObject = baseStylesObject({ element, theme });
            }

            // Transform `StylesObject` into `CSSObject`.
            const cssObject = getStyles(baseStylesObject);
            styles.push(cssObject);
        }

        if (options.themeStyles) {
            let themeStylesObject = options.themeStyles;
            if (typeof themeStylesObject === "function") {
                themeStylesObject = themeStylesObject({ element, theme });
            }

            // Transform `StylesObject` into `CSSObject`.
            const cssObject = getStyles(themeStylesObject);
            styles.push(cssObject);
        } else {
            const themeStylesObject = theme.styles.elements[element.type];

            const cssObject = getStyles(themeStylesObject);
            styles.push(cssObject);
        }

        // Styles applied via registered styles modifiers (applied via the PB editor's right sidebar).
        styles.push(getElementStyles(element));

        // Calculate input values using props and fallback values from `element.data`.
        const inputValues = useMemo(() => {
            const elementInputs: ElementInputs = options.inputs || EMPTY_OBJECT;
            const inputValues = (inputs || EMPTY_OBJECT) as ElementInputValues<TInputs>;

            return Object.entries(elementInputs).reduce((values, [key, input]) => {
                const inputValue =
                    key in inputValues ? inputValues[key] : input.getDefaultValue(element);

                return { ...values, [key]: inputValue };
            }, {});
        }, [element, inputs]);

        return (
            <ClassNames>
                {({ css }) => {
                    const BeforeRenderer = beforeRenderer;
                    const AfterRenderer = afterRenderer;

                    // Used "o" in order to keep the final class name shorter. For example: "css-1c63dz3-o".
                    const o = [css(styles), attributes.class].filter(Boolean).join(" ");

                    return (
                        <ElementRendererInputs
                            element={element}
                            inputs={options.inputs}
                            values={inputValues}
                        >
                            <RendererProvider
                                element={element}
                                attributes={{ ...attributes, className: o }}
                                meta={{ ...meta, calculatedStyles: styles }}
                            >
                                {React.createElement(
                                    `pb-${element.type}`,
                                    { ...attributes, class: o },
                                    <>
                                        {BeforeRenderer ? <BeforeRenderer /> : null}
                                        <DecoratableRendererComponent
                                            key={"decoratable-component"}
                                            {...(componentProps as unknown as TRenderComponentProps)}
                                        />
                                        {AfterRenderer ? <AfterRenderer /> : null}
                                    </>
                                )}
                            </RendererProvider>
                        </ElementRendererInputs>
                    );
                }}
            </ClassNames>
        );
    }

    /**
     * Wrap the concrete element renderer with an extra element, to allow decoration.
     * This allows developers to intercept props, replace the actual renderer, hide the element, etc.
     */
    function Renderer(
        props: React.ComponentProps<Renderer<TRenderComponentProps & Inputs<TInputs>>>
    ) {
        return <ElementRenderer {...props} renderer={ConcreteRenderer} />;
    }

    return Object.assign(makeDecoratable("ElementRenderer", Renderer), {
        Component: DecoratableRendererComponent,
        inputs: options.inputs
    });
}

const BaseElementRenderer = (
    props: React.ComponentProps<Renderer<Record<string, any> & Inputs<ElementInputs>>> & {
        renderer: React.ComponentType<any>;
    }
) => {
    const { renderer, ...rest } = props;

    return React.createElement(renderer, rest);
};

/**
 * This component allows developers to intercept all element renderers using a single decorator.
 */
export const ElementRenderer = makeDecoratable("ElementRenderer", BaseElementRenderer);
