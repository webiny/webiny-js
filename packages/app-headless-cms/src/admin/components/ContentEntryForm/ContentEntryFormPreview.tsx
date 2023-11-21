import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { Form, FormRenderPropParams } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { RenderFieldElement } from "./RenderFieldElement";
import { CmsContentFormRendererPlugin, CmsEditorContentModel } from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});

interface Props {
    contentModel: CmsEditorContentModel;
}

export const ContentEntryFormPreview: React.FC<Props> = props => {
    const { contentModel } = props;

    const formRenderer = plugins
        .byType<CmsContentFormRendererPlugin>("cms-content-form-renderer")
        .find(pl => pl.modelId === contentModel.modelId);

    const renderCustomLayout = useCallback(
        (formRenderProps: FormRenderPropParams) => {
            const fields = contentModel.fields.reduce((acc, field) => {
                /**
                 * TODO @ts-refactor
                 * Figure out type for Bind.
                 */
                acc[field.fieldId] = (
                    <RenderFieldElement
                        field={field}
                        Bind={formRenderProps.Bind as any}
                        contentModel={contentModel}
                    />
                );

                return acc;
            }, {} as Record<string, React.ReactElement>);
            if (!formRenderer) {
                return <>{`Missing form renderer for modelId "${contentModel.modelId}".`}</>;
            }
            return formRenderer.render({
                ...formRenderProps,
                /**
                 * TODO @ts-refactor
                 * Figure out type for Bind.
                 */
                Bind: formRenderProps.Bind as any,
                contentModel,
                fields
            });
        },
        [formRenderer, contentModel.fields]
    );

    return (
        <Form>
            {formProps => (
                <FormWrapper data-testid={"cms-content-form"}>
                    {formRenderer ? (
                        renderCustomLayout(formProps)
                    ) : (
                        <Fields
                            contentModel={contentModel}
                            fields={contentModel.fields}
                            layout={contentModel.layout || []}
                            {...formProps}
                            Bind={formProps.Bind as any}
                        />
                    )}
                </FormWrapper>
            )}
        </Form>
    );
};
