import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { Form, FormRenderPropParams } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { makeDecoratable } from "@webiny/app-admin";
import { FieldElement } from "./FieldElement";
import { CmsContentFormRendererPlugin, CmsEditorContentModel } from "~/types";
import { Fields } from "~/admin/components/ContentEntryForm/Fields";
import { ModelProvider } from "~/admin/components/ModelProvider";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});

export interface ContentEntryFormPreviewProps {
    contentModel: CmsEditorContentModel;
}

export const ContentEntryFormPreview = makeDecoratable(
    "ContentEntryFormPreview",
    (props: ContentEntryFormPreviewProps) => {
        const { contentModel } = props;

        const formRenderer = plugins
            .byType<CmsContentFormRendererPlugin>("cms-content-form-renderer")
            .find(pl => pl.modelId === contentModel.modelId);

        const renderCustomLayout = useCallback(
            (formRenderProps: FormRenderPropParams) => {
                const fields = contentModel.fields.reduce((acc, field) => {
                    acc[field.fieldId] = (
                        <FieldElement
                            field={field}
                            /**
                             * TODO @ts-refactor
                             * Figure out type for Bind.
                             */
                            // @ts-expect-error
                            Bind={formRenderProps.Bind}
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
                    // @ts-expect-error
                    Bind: formRenderProps.Bind,
                    contentModel,
                    fields
                });
            },
            [formRenderer, contentModel.fields]
        );

        return (
            <Form>
                {formProps => (
                    <ModelProvider model={contentModel}>
                        <FormWrapper data-testid={"cms-content-form"}>
                            {formRenderer ? (
                                renderCustomLayout(formProps)
                            ) : (
                                <Fields
                                    contentModel={contentModel}
                                    fields={contentModel.fields}
                                    layout={contentModel.layout || []}
                                    {...formProps}
                                    /**
                                     * TODO @ts-refactor
                                     * Figure out type for Bind.
                                     */
                                    // @ts-expect-error
                                    Bind={formProps.Bind}
                                />
                            )}
                        </FormWrapper>
                    </ModelProvider>
                )}
            </Form>
        );
    }
);
