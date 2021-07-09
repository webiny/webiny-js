import React, { useCallback, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { Form, FormRenderPropParams } from "@webiny/form";
import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import RenderFieldElement from "./RenderFieldElement";
import { CmsContentFormRendererPlugin } from "~/types";
import { useContentEntryForm, UseContentEntryFormParams } from "./useContentEntryForm";
import { Fields } from "./Fields";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});

interface ContentEntryFormProps extends UseContentEntryFormParams {
    onForm?: (form: Form) => void;
}

export const ContentEntryForm = ({ onForm, ...props }: ContentEntryFormProps) => {
    const { contentModel } = props;
    const {
        loading,
        data,
        onChange,
        onSubmit,
        invalidFields
    } = useContentEntryForm(props);

    const ref = useRef(null);

    useEffect(() => {
        typeof onForm === "function" && onForm(ref.current);
    }, []);

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
        [formRenderer]
    );

    return (
        <Form
            onChange={onChange}
            onSubmit={onSubmit}
            data={data}
            ref={ref}
            invalidFields={invalidFields}
        >
            {formProps => (
                <FormWrapper data-testid={"cms-content-form"}>
                    {loading && <CircularProgress />}
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
                </FormWrapper>
            )}
        </Form>
    );
};
