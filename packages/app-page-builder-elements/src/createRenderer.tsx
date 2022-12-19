import React from "react";
import styled from "@emotion/styled";
import { usePageElements } from "~/hooks/usePageElements";
import { Renderer, Element, Theme, StylesObjects } from "~/types";
import { elementDataPropsAreEqual } from "~/utils";
import { RendererProvider } from "~/contexts/Renderer";

interface GetStylesParams {
    theme: Theme;
    element: Element;
}

type CreateRendererOptions = Partial<{
    propsAreEqual: <T = {}>(prevProps: T, nextProps: T) => boolean;
    getBaseStyles: (params: GetStylesParams) => StylesObjects | undefined;
    getThemeStyles: (params: GetStylesParams) => StylesObjects | undefined;
}>;

export function createRenderer<T = {}>(
    RendererComponent: React.ComponentType<T>,
    options: CreateRendererOptions = {}
): Renderer<T> {
    const renderer: Renderer<T> = function Renderer(props) {
        const { getElementStyles, getElementAttributes, theme } = usePageElements();

        const { element, ...componentProps } = props;
        const attributes = getElementAttributes(element);

        let baseStyles;
        if (options.getBaseStyles) {
            baseStyles = options.getBaseStyles({ element, theme });
        }

        let themeStyles: StylesObjects;
        if (options.getThemeStyles) {
            themeStyles = options.getThemeStyles({ element, theme })!;
        } else {
            themeStyles = theme.styles.elements[element.type];
        }

        const elementStyles = getElementStyles(element);

        const styles = [baseStyles, themeStyles, elementStyles];

        const StyledRendererComponent = styled((styledRendererProps: any) => {
            const className = [styledRendererProps.className, attributes.className]
                .filter(Boolean)
                .join(" ");

            return (
                <RendererProvider element={element} attributes={{ ...attributes, className }}>
                    {/* Would've liked if the `as unknown as T` part wasn't
                        needed, but unfortunately I could not figure it out. */}
                    <RendererComponent {...(componentProps as unknown as T)} />
                </RendererProvider>
            );
        })(styles);

        return <StyledRendererComponent />;
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
