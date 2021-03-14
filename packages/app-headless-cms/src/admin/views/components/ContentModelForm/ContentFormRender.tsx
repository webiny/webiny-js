import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Form, FormOnSubmit, FormRenderPropParams } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { plugins } from "@webiny/plugins";
import styled from "@emotion/styled";
import {
    CmsContentFormRendererPlugin,
    CmsEditorContentModel,
    
    CmsEditorFieldRendererPlugin
} from "~/types";
import RenderFieldElement from "./ContentFormRender/RenderFieldElement";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});
interface ContentFormRenderProps {
    getFields: Function;
    getDefaultValues: Function;
    loading?: boolean;
    entry: any;
    contentModel: CmsEditorContentModel;
    onSubmit: FormOnSubmit;
    onChange: FormOnSubmit;
    onForm?: any;
    invalidFields?: Record<string, string>;
}
export const ContentFormRender: React.FunctionComponent<ContentFormRenderProps> = ({
    getFields,
    getDefaultValues,
    loading = false,
    entry,
    contentModel,
    onSubmit,
    onChange,
    onForm = null,
    invalidFields = {}
}) => {
    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();
    const ref = useRef(null);

    useEffect(() => {
        typeof onForm === "function" && onForm(ref.current);
    }, []);

    const renderPlugins = useMemo(
        () => plugins.byType<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );

    const formRenderer = plugins
        .byType<CmsContentFormRendererPlugin>("cms-content-form-renderer")
        .find(pl => pl.modelId === contentModel.modelId);

    const renderDefaultLayout = useCallback(({ Bind }: FormRenderPropParams) => {
        return (
            <Grid>
                {fields.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                        {row.map(field => (
                            <Cell span={Math.floor(12 / row.length)} key={field.id}>
                                <RenderFieldElement
                                    field={field}
                                    Bind={Bind}
                                    renderPlugins={renderPlugins}
                                    contentModel={contentModel}
                                />
                            </Cell>
                        ))}
                    </React.Fragment>
                ))}
            </Grid>
        );
    }, []);

    const renderCustomLayout = useCallback(
        (formRenderProps: FormRenderPropParams) => {
            const fields = contentModel.fields.reduce((acc, field) => {
                acc[field.fieldId] = (
                    <RenderFieldElement
                        field={field}
                        Bind={formRenderProps.Bind}
                        renderPlugins={renderPlugins}
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
            data={entry ? entry : getDefaultValues()}
            ref={ref}
            invalidFields={invalidFields}
        >
            {formProps => (
                <FormWrapper data-testid={"cms-content-form"}>
                    {loading && <CircularProgress />}
                    {formRenderer ? renderCustomLayout(formProps) : renderDefaultLayout(formProps)}
                </FormWrapper>
            )}
        </Form>
    );
};
