import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type { CmsContentFormRendererPlugin } from "@webiny/app-headless-cms-common/types/index.js";

type CmsContentFormRendererProps = Pick<CmsContentFormRendererPlugin, "modelId" | "render">;

export const CmsContentFormRenderer = (props: CmsContentFormRendererProps) => {
    useEffect(() => {
        plugins.register({
            type: "cms-content-form-renderer",
            name: `cms-content-form-renderer-${props.modelId}`,
            modelId: props.modelId,
            render: props.render
        } satisfies CmsContentFormRendererPlugin);
    }, []);
    return null;
};
