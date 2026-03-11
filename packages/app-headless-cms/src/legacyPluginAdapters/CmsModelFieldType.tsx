import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type { CmsModelFieldTypePlugin } from "@webiny/app-headless-cms-common/types/index.js";

type CmsModelFieldTypeProps = CmsModelFieldTypePlugin["field"];

export const CmsModelFieldType = (props: CmsModelFieldTypeProps) => {
    useEffect(() => {
        plugins.register({
            type: "cms-editor-field-type",
            name: `cms-editor-field-type-${props.type}`,
            field: props
        } satisfies CmsModelFieldTypePlugin);
    }, []);
    return null;
};
