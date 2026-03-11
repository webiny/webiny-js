import React from "react";
import { Bind, useForm } from "@webiny/form";
import type {
    BindComponent,
    CmsContentFormRendererPlugin,
    CmsModel
} from "@webiny/app-headless-cms-common/types/index.js";
import { FieldElement } from "~/admin/components/ContentEntryForm/FieldElement.js";

interface CustomLayoutProps {
    model: CmsModel;
    formRenderer: CmsContentFormRendererPlugin;
}

export const CustomLayout = ({ model, formRenderer }: CustomLayoutProps) => {
    const { data } = useForm();

    const fields = model.fields.reduce(
        (acc, field) => {
            acc[field.fieldId] = (
                <FieldElement field={field} Bind={Bind as BindComponent} contentModel={model} />
            );

            return acc;
        },
        {} as Record<string, React.ReactElement>
    );

    return (
        <>
            {formRenderer.render({
                data,
                contentModel: model,
                fields,
                Bind: Bind as BindComponent
            })}
        </>
    );
};
