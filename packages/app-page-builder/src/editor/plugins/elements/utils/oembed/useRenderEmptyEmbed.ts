import { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorElement, PbEditorPageElementPlugin } from "../../../../../types";

export default (element: PbEditorElement) => {
    return useCallback(() => {
        if (!element) {
            return () => null;
        }

        const [pageElementPlugin] = plugins
            .byType(PbEditorPageElementPlugin)
            .filter(pl => pl.elementType === element.type);
        return pageElementPlugin.toolbar.preview();
    }, [element]);
};
