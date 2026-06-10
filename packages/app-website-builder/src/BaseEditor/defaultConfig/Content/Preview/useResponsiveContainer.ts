import { useCallback, useEffect, useState } from "react";
import { useBreakpoint } from "~/BaseEditor/hooks/useBreakpoint.js";
import type { ViewportManager } from "@webiny/website-builder-sdk";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";

/**
 * Calculate the real width of the preview container, taking into account reserved UI space, breakpoint,
 * and viewport width. If the display mode width is larger than the available space, return the
 * width of the available space.
 */
export const useResponsiveContainer = (viewportManager: ViewportManager) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const editor = useDocumentEditor();
    const uiWidth = useSelectFromEditor(state => state.uiReservedSpace.width);
    const { breakpoint } = useBreakpoint();

    const updateContainerWidth = useCallback(() => {
        const uiWidth = editor.getEditorState().read().uiReservedSpace.width;
        // Subtract horizontal padding (2 × 24 px from p-6 on PreviewContainer) so preview-body
        // fits inside the padded container without overflowing the flex layout.
        setContainerWidth(document.body.clientWidth - uiWidth - 48);
    }, [editor]);

    useEffect(() => {
        updateContainerWidth();
    }, [breakpoint.name, uiWidth]);

    useEffect(() => {
        return viewportManager.onViewportChangeEnd(updateContainerWidth);
    }, []);

    return Math.min(containerWidth, breakpoint.maxWidth);
};
