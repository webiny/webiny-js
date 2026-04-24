import { plugins } from "@webiny/plugins";
import { useMemo } from "react";
import type { CmsModelFieldRendererPlugin } from "~/types/index.js";

export function useRenderPlugins() {
    return useMemo(
        () => plugins.byType<CmsModelFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );
}
