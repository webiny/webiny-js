import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import kebabCase from "lodash/kebabCase";
import { plugins } from "@webiny/plugins";
import RenderElement from "@webiny/app-page-builder/render/components/Element";
import { PbElement, PbRenderResponsiveModePlugin } from "@webiny/app-page-builder/types";

const Document = ({ element }: { element: PbElement }) => {
    const [editorMode, setEditorMode] = useState("desktop");
    const pagePreviewRef = useRef();
    const responsiveModeConfigs = useMemo(() => {
        return plugins
            .byType<PbRenderResponsiveModePlugin>("pb-render-responsive-mode")
            .map(pl => pl.config);
    }, []);

    const resizeObserver = useMemo(() => {
        // @ts-ignore
        return new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                handlerResize({ width, height });
            }
        });
    }, []);
    // Set resize observer
    useEffect(() => {
        // webiny-pb-editor-content-preview
        if (pagePreviewRef.current) {
            // Add resize observer
            resizeObserver.observe(pagePreviewRef.current);
        }
    }, []);
    // Handle document resize
    const handlerResize = useCallback(
        ({ width }) => {
            let mode = "desktop";
            responsiveModeConfigs.forEach(config => {
                if (width <= config.minWidth) {
                    mode = config.name;
                }
            });

            setEditorMode(mode);
        },
        [responsiveModeConfigs]
    );

    if (!element || Array.isArray(element)) {
        return null;
    }
    return (
        <div
            ref={pagePreviewRef}
            className={`webiny-pb-page-document webiny-pb-page-document-mode--${kebabCase(
                editorMode
            )}`}
        >
            {element.elements.map(element => (
                <RenderElement key={element.id} element={element} />
            ))}
        </div>
    );
};

export default Document;
