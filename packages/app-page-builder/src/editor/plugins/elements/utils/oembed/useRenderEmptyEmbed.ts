import React, { useCallback } from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorElement } from "~/types";

interface Callable {
    (): React.ReactElement | null;
}
export default (element?: PbEditorElement | null): Callable => {
    return useCallback(() => {
        if (!element) {
            return (): React.ReactElement | null => null;
        }

        const [pageElementPlugin] = plugins
            .byType("pb-editor-page-element")
            .filter(pl => pl.elementType === element.type);
        return pageElementPlugin.toolbar.preview();
    }, [element]);
};
