import React, { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorElement, PbEditorPageElementPlugin } from "~/types";

interface Callable {
    (): React.ReactElement | null;
}
export default (element?: PbEditorElement | null): Callable => {
    return useCallback(() => {
        if (!element) {
            return null;
        }

        const [pageElementPlugin] = plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .filter(pl => pl.elementType === element.type);
        if (
            !pageElementPlugin ||
            !pageElementPlugin.toolbar ||
            !pageElementPlugin.toolbar.preview
        ) {
            return null;
        }
        const result = pageElementPlugin.toolbar.preview();
        if (!result) {
            return null;
        }
        return result as React.ReactElement;
    }, [element]);
};
