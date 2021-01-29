import { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorElement } from "../../../../../types";

export default (element: PbEditorElement) => {
    return useCallback(() => {
        if (!element) {
            return () => null;
        }

        const [pageElementPlugin] = plugins
            .byType("pb-editor-page-element")
            .filter(pl => pl.elementType === element.type);
        return pageElementPlugin.toolbar.preview();
    }, [element]);
};
