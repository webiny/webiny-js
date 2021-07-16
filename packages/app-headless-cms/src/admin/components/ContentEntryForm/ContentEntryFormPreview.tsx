import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { Form, FormRenderPropParams } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import RenderFieldElement from "./RenderFieldElement";
import { CmsContentFormRendererPlugin, CmsEditorContentModel } from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});

interface Props {
    contentModel: CmsEditorContentModel;
}

export const ContentEntryFormPreview = (props: Props) => {
    const { contentModel } = props;

    const formRenderer = plugins
        .byType<CmsContentFormRendererPlugin>("cms-content-form-renderer")
        .find(pl => pl.modelId === contentModel.modelId);

    const renderCustomLayout = useCallback(
        (formRenderProps: FormRenderPropParams) => {
            const fields = contentModel.fields.reduce((acc, field) => {
                acc[field.fieldId] = (
                    <RenderFieldElement
                        field={field}
                        Bind={formRenderProps.Bind}
                        contentModel={contentModel}
                    />
                );

                return acc;
            }, {});
            return formRenderer.render({ ...formRenderProps, contentModel, fields });
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
                            layout={contentModel.layout}
                            {...formProps}
                        />
                    )}
                    <pre
                        style={{
                            fontFamily: "MonoLisa",
                            padding: 15,
                            backgroundColor: "var(--mdc-theme-background)"
                        }}
                    >
                        {JSON.stringify(formProps.data, null, 2)}
                    </pre>
                </FormWrapper>
            )}
        </Form>
    );
};
