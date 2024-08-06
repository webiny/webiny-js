import React from "react";
import { Bind, useForm } from "@webiny/form";
import { CmsContentFormRendererPlugin, CmsModel } from "@webiny/app-headless-cms-common/types";
import { FieldElement } from "~/admin/components/ContentEntryForm/FieldElement";

interface CustomLayoutProps {
    model: CmsModel;
    formRenderer: CmsContentFormRendererPlugin;
}

export const CustomLayout = ({ model, formRenderer }: CustomLayoutProps) => {
    const { data } = useForm();

    const fields = model.fields.reduce(
        (acc, field) => {
            acc[field.fieldId] = (
                <FieldElement
                    field={field}
                    /**
                     * TODO @ts-refactor
                     * Figure out type for Bind.
                     */
                    // @ts-expect-error
                    Bind={Bind}
                    contentModel={model}
                />
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
                /**
                 * TODO @ts-refactor
                 * Figure out type for Bind.
                 */
                // @ts-expect-error
                Bind
            })}
        </>
    );
};
