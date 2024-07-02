import React from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Renderer, Element } from "~/types";
import { Theme, StylesObject } from "@webiny/theme/types";
import { RendererProvider } from "~/contexts/Renderer";
import { CSSObject, ClassNames } from "@emotion/react";
import { ElementAttribute } from "~/attributes/ElementAttribute";

interface GetStylesParams {
    theme: Theme;
    element: Element;
}

export type CreateRendererOptions<
    TRenderComponentProps,
    TAttributes = Record<string, ElementAttribute>
> = Partial<{
    propsAreEqual: (prevProps: TRenderComponentProps, nextProps: TRenderComponentProps) => boolean;
    themeStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    baseStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    attributes: TAttributes;
}>;

const DEFAULT_RENDERER_STYLES: StylesObject = {
    display: "block",
    position: "relative",
    width: "100%",
    boxSizing: "border-box"
};

export type GetInputs<T> = {
    inputs?: { [K in keyof T]?: T[K] extends ElementAttribute<infer P> ? P : never };
};

export function createRenderer<
    TRenderComponentProps = Record<string, any>,
    TAttributes extends Record<string, ElementAttribute> = Record<string, ElementAttribute>
>(
    RendererComponent: React.ComponentType<TRenderComponentProps>,
    options: CreateRendererOptions<TRenderComponentProps, TAttributes> = {}
): Renderer<TRenderComponentProps & GetInputs<TAttributes>> {
    return function Renderer(props) {
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

        const { element, meta, inputs = {}, ...componentProps } = props;
        const attributes = getElementAttributes(element);

        const inputAttributes: TAttributes = options.attributes ?? ({} as TAttributes);
        const inputsValues = Object.keys(inputAttributes).reduce((values, key) => {
            const attribute = key in inputAttributes ? inputAttributes[key] : undefined;
            if (attribute) {
                // @ts-expect-error
                const inputValue = key in inputs ? inputs[key] : attribute.getValue(element);

                return { ...values, [key]: inputValue };
            }
            return values;
        }, {});

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

        return (
            <ClassNames>
                {({ css }) => {
                    const BeforeRenderer = beforeRenderer;
                    const AfterRenderer = afterRenderer;

                    // Used "o" in order to keep the final class name shorter. For example: "css-1c63dz3-o".
                    const o = [css(styles), attributes.class].filter(Boolean).join(" ");

                    return (
                        <RendererProvider
                            element={element}
                            attributes={{ ...attributes, className: o }}
                            meta={{ ...meta, calculatedStyles: styles }}
                            inputs={inputsValues}
                        >
                            {React.createElement(
                                `pb-${element.type}`,
                                { ...attributes, class: o },
                                <>
                                    {BeforeRenderer ? <BeforeRenderer /> : null}

                                    {/* Would've liked if the `as unknown as T` part wasn't
                                        needed, but unfortunately, could not figure it out. */}
                                    <RendererComponent
                                        {...(componentProps as unknown as TRenderComponentProps)}
                                    />
                                    {AfterRenderer ? <AfterRenderer /> : null}
                                </>
                            )}
                        </RendererProvider>
                    );
                }}
            </ClassNames>
        );
    };
}
