import React from "react";
import { useEffect } from "react";
import { plugins } from "@webiny/plugins";
import type {
    BindComponent,
    CmsModelLayoutField,
    CmsModel,
    CmsModelField,
    CmsModelLayoutFieldRendererPlugin
} from "@webiny/app-headless-cms-common/types/index.js";

export interface CmsModelLayoutFieldRendererProps<
    T extends CmsModelLayoutField = CmsModelLayoutField
> {
    fieldType: string;
    render(props: {
        field: T;
        Bind: BindComponent;
        fields: CmsModelField[];
        contentModel: CmsModel;
        gridClassName?: string;
    }): React.ReactElement | null;
}

export const CmsModelLayoutFieldRenderer = <T extends CmsModelLayoutField = CmsModelLayoutField>(
    props: CmsModelLayoutFieldRendererProps<T>
) => {
    useEffect(() => {
        plugins.register({
            type: "cms-layout-field-renderer",
            name: `cms-layout-field-renderer-${props.fieldType}`,
            fieldType: props.fieldType,
            render: props.render
        } as CmsModelLayoutFieldRendererPlugin);
    }, []);
    return null;
};
