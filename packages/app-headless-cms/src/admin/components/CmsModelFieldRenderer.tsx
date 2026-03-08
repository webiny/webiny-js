import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type { CmsModelFieldRendererPlugin } from "@webiny/app-headless-cms-common/types/index.js";

type CmsModelFieldRendererProps = CmsModelFieldRendererPlugin["renderer"];

export const CmsModelFieldRenderer = (props: CmsModelFieldRendererProps) => {
    useEffect(() => {
        plugins.register({
            type: "cms-editor-field-renderer",
            name: `cms-editor-field-renderer-${props.rendererName}`,
            renderer: props
        } satisfies CmsModelFieldRendererPlugin);
    }, []);
    return null;
};
