import { plugins } from "@webiny/plugins";
import { useMemo } from "react";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms-common/types";

export function useRenderPlugins() {
    return useMemo(
        () => plugins.byType<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );
}
