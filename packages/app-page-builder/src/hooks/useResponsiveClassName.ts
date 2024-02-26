import React from "react";
import { plugins } from "@webiny/plugins";
import kebabCase from "lodash/kebabCase";
import { DisplayMode, PbRenderResponsiveModePlugin } from "~/types";
import { usePageBuilder } from "~/hooks/usePageBuilder";

interface UseResponsiveClassName {
    pageElementRef: (node: HTMLElement | null) => void;
    responsiveClassName: string;
}

// @deprecation-warning pb-legacy-rendering-engine
const useResponsiveClassName = (): UseResponsiveClassName => {
    const {
        responsiveDisplayMode: { displayMode, setDisplayMode }
    } = usePageBuilder();
    const ref = React.useRef<HTMLElement>();

    // Get "responsive-mode" plugins
    const responsiveModeConfigs = React.useMemo(() => {
        return plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);
    }, []);
    // Create resize observer
    const resizeObserver = React.useMemo(() => {
        return new ResizeObserver((entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                handlerResize({ width, height });
            }
        });
    }, []);

    const pageElementRef = React.useCallback((node: HTMLElement | null): void => {
        if (ref.current) {
            // Make sure to cleanup any events/references added to the last instance
            resizeObserver.disconnect();
        }
        if (!node) {
            return;
        }
        // Add resize observer
        resizeObserver.observe(node);
        // Save a reference to the node
        ref.current = node;
    }, []);

    // Handle document resize
    const handlerResize = React.useCallback(
        ({ width }: { width: number; height: number }): void => {
            let mode = "desktop";
            responsiveModeConfigs.forEach(config => {
                if (width <= config.minWidth) {
                    mode = config.displayMode;
                }
            });
            /**
             * We can safely cast.
             */
            setDisplayMode(mode as DisplayMode);
        },
        [responsiveModeConfigs]
    );

    return {
        pageElementRef,
        responsiveClassName: `webiny-pb-media-query--${kebabCase(displayMode)}`
    };
};

export default useResponsiveClassName;
