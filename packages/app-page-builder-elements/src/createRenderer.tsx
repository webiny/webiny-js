import React from "react";
import styled from "@emotion/styled";
import { usePageElements } from "~/hooks/usePageElements";
import { Renderer, Element } from "~/types";
import { Theme, StylesObject } from "@webiny/app-page-builder-theme/types";
import { elementDataPropsAreEqual } from "~/utils";
import { RendererProvider } from "~/contexts/Renderer";
import { CSSObject } from "@emotion/core";

interface GetStylesParams {
    theme: Theme;
    element: Element;
}

type CreateRendererOptions = Partial<{
    propsAreEqual: <T = {}>(prevProps: T, nextProps: T) => boolean;
    themeStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    baseStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
}>;

const DEFAULT_RENDERER_STYLES: StylesObject = { display: "block", position: "relative" };

export function createRenderer<T = {}>(
    RendererComponent: React.ComponentType<T>,
    options: CreateRendererOptions = {}
): Renderer<T> {
    const renderer: Renderer<T> = function Renderer(props) {
        const {
            getElementStyles,
            getStyles,
            getElementAttributes,
            theme,
            beforeRenderer,
            afterRenderer
        } = usePageElements();

        const { element, meta, ...componentProps } = props;
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

        // Used "O" in order to keep the final class name shorter. For example: "css-1c63dz3-O".
        const O = styled((styledRendererProps: any) => {
            const BeforeRenderer = beforeRenderer;
            const AfterRenderer = afterRenderer;

            const className = [styledRendererProps.className, attributes.class]
                .filter(Boolean)
                .join(" ");

            return (
                <RendererProvider
                    element={element}
                    attributes={{ ...attributes, className }}
                    meta={{ ...meta, calculatedStyles: styles }}
                >
                    {/* Would've liked if the `as unknown as T` part wasn't
                        needed, but unfortunately I could not figure it out. */}
                    {React.createElement(
                        `pb-${element.type}`,
                        { ...attributes, class: className },
                        <>
                            {BeforeRenderer ? <BeforeRenderer /> : null}
                            <RendererComponent {...(componentProps as unknown as T)} />
                            {AfterRenderer ? <AfterRenderer /> : null}
                        </>
                    )}
                </RendererProvider>
            );
        })(styles);

        return <O />;
    };

    return React.memo(renderer, (prevProps, nextProps) => {
        const { propsAreEqual } = options;
        if (propsAreEqual) {
            if (propsAreEqual(prevProps as T, nextProps as T) === false) {
                return false;
            }
        }

        return elementDataPropsAreEqual(prevProps, nextProps);
    });
}
