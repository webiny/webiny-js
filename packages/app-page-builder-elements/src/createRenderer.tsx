import React, { useEffect, useMemo, useState } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Renderer, Element, RendererLoader, RendererLoaderResult } from "~/types";
import { Theme, StylesObject } from "@webiny/theme/types";
import { RendererProvider } from "~/contexts/Renderer";
import { CSSObject, ClassNames } from "@emotion/core";

interface GetStylesParams {
    theme: Theme;
    element: Element;
}

export type CreateRendererOptions<TRenderComponentProps> = Partial<{
    propsAreEqual: (prevProps: TRenderComponentProps, nextProps: TRenderComponentProps) => boolean;
    themeStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    baseStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    loader: (params: { element: Element }) => Promise<any>;
}>;

const DEFAULT_RENDERER_STYLES: StylesObject = {
    display: "block",
    position: "relative",
    width: "100%",
    boxSizing: "border-box"
};

export function createRenderer<TRenderComponentProps = {}>(
    RendererComponent: React.ComponentType<TRenderComponentProps>,
    options: CreateRendererOptions<TRenderComponentProps> = {}
): Renderer<TRenderComponentProps> {
    return function Renderer(props) {
        const {
            getElementStyles,
            getStyles,
            getElementAttributes,
            theme,
            beforeRenderer,
            afterRenderer
        } = usePageElements();

        const { element, meta, ...componentProps } = props;

        const loaderCachedResult = useMemo<RendererLoaderResult>(() => {
            if (!options.loader) {
                return null;
            }

            const cachedResultElement = document.querySelector(
                `pe-loader-result[data-key="${element.id}"]`
            );

            if (!cachedResultElement) {
                return null;
            }

            const cachedResultElementValue = cachedResultElement.getAttribute("data-value");
            if (!cachedResultElementValue) {
                return null;
            }

            return JSON.parse(cachedResultElementValue);
        }, []);

        const [loader, setLoader] = useState<RendererLoader>(
            loaderCachedResult
                ? {
                      result: loaderCachedResult,
                      loading: false
                  }
                : { result: { data: null, error: null }, loading: false }
        );

        useEffect(() => {
            if (!options.loader || loaderCachedResult) {
                return;
            }

            options
                .loader({ element })
                .then(data => setLoader({ ...loader, result: { data, error: null } }))
                .catch(error => setLoader({ ...loader, result: { data: null, error } }))
                .finally(() => setLoader({ ...loader, loading: false }));
        }, []);

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

        return (
            <ClassNames>
                {({ css }) => {
                    const BeforeRenderer = beforeRenderer;
                    const AfterRenderer = afterRenderer;

                    // Used "o" in order to keep the final class name shorter. For example: "css-1c63dz3-o".
                    const o = [css(styles), attributes.class].filter(Boolean).join(" ");

                    return (
                        <RendererProvider
                            loader={loader}
                            element={element}
                            attributes={{ ...attributes, className: o }}
                            meta={{ ...meta, calculatedStyles: styles }}
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
