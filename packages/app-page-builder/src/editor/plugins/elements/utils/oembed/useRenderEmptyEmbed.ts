import { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { PbElement } from "../../../../../types";

export default (element: PbElement) => {
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
