import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type {
    CmsLayoutField,
    CmsModelLayoutFieldTypePlugin
} from "@webiny/app-headless-cms-common/types/index.js";

export const CmsModelLayoutFieldType = <T extends CmsLayoutField = CmsLayoutField>(
    props: CmsModelLayoutFieldTypePlugin<T>["field"]
) => {
    useEffect(() => {
        plugins.register({
            type: "cms-editor-layout-field-type",
            name: `cms-editor-layout-field-type-${props.type}`,
            field: props as unknown as CmsModelLayoutFieldTypePlugin["field"]
        } satisfies CmsModelLayoutFieldTypePlugin);
    }, []);
    return null;
};
