import React, { useEffect, useMemo, useState } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { Renderer, Element, RendererLoader, RendererProps } from "~/types";
import { Theme, StylesObject } from "@webiny/theme/types";
import { RendererProvider } from "~/contexts/Renderer";
import { CSSObject, ClassNames } from "@emotion/core";
import { createObjectHash } from "~/utils";

type GetElement = <TElementData = Record<string, any>>() => Element<TElementData>;
type Loader = <TRenderComponentProps, TLoaderData>(
    params: RendererOptionsLoaderParams<TRenderComponentProps>
) => TLoaderData;

interface GetStylesParams {
    theme: Theme;
    element: Element;
}

interface RendererOptionsLoaderParams<TRenderComponentProps> {
    getElement: GetElement;
    props: TRenderComponentProps;
}

export type CreateRendererOptions<TRenderComponentProps> = Partial<{
    propsAreEqual: (prevProps: TRenderComponentProps, nextProps: TRenderComponentProps) => boolean;
    themeStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    baseStyles: StylesObject | ((params: GetStylesParams) => StylesObject);
    loader?: Loader;
}>;

const DEFAULT_RENDERER_STYLES: StylesObject = {
    display: "block",
    position: "relative",
    width: "100%",
    boxSizing: "border-box"
};

const getElementCacheKey = (element: Element) => {
    const elementDataHash = createObjectHash(element.data);
    return `${element.id}-${elementDataHash}`;
};

const getLoaderCachedData = (element: Element) => {
    const elementCacheKey = getElementCacheKey(element);
    let data = localStorage[`pe_loader_data_cache_${elementCacheKey}`];
    if (data) {
        return data;
    }

    data = window?.__PE_LOADER_DATA_CACHE__?.[elementCacheKey];
    if (data) {
        return data;
    }

    const htmlElement = document.querySelector(
        `pe-loader-data-cache[data-key="${elementCacheKey}"]`
    );
    if (!htmlElement) {
        return null;
    }

    const cachedResultElementValue = htmlElement.getAttribute("data-value");
    if (!cachedResultElementValue) {
        return null;
    }

    try {
        return JSON.parse(cachedResultElementValue);
    } catch {
        return null;
    }
};

function useLoader<TRenderComponentProps>(
    options: CreateRendererOptions<TRenderComponentProps>,
    props: RendererProps<TRenderComponentProps>
): RendererLoader {
    const optionsLoader = options.loader;
    if (!optionsLoader) {
        return { data: null, loading: false, cacheHit: false };
    }

    const { element } = props;
    const elementDataHash = createObjectHash(element.data);

    const loaderCachedData = useMemo<Awaited<ReturnType<typeof optionsLoader>>>(
        () => getLoaderCachedData(element),
        []
    );

    const [loader, setLoader] = useState<RendererLoader>(
        loaderCachedData
            ? {
                  data: loaderCachedData,
                  loading: false,
                  cacheHit: true
              }
            : { data: null, loading: Boolean(options.loader), cacheHit: false }
    );

    useEffect(() => {
        const loaderParams: RendererOptionsLoaderParams<TRenderComponentProps> = {
            getElement: (() => element) as GetElement,
            props
        };

        optionsLoader(loaderParams).then(data => {
            const html = `<pe-loader-data-cache data-key="${
                element.id
            }-${elementDataHash}" data-value='${JSON.stringify(data)}'></pe-loader-data-cache>`;
            document.body.insertAdjacentHTML("beforeend", html);

            setLoader({ ...loader, data, loading: false });
        });

        return () => {
            // TODO: clean all stored caches.
        };
    }, [elementDataHash]);

    return loader;
}

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

        // We can't render anything if `theme` is not available.
        if (!theme) {
            return null;
        }

        const { element, meta, ...componentProps } = props;

        // 1. Loader.
        const loader = useLoader<TRenderComponentProps>(options, props);

        // 2. Attributes.
        const attributes = getElementAttributes(element);

        // 3. Styles.
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
