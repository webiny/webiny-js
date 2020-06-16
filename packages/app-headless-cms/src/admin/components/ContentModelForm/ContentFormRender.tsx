import React, { useEffect, useRef, useMemo } from "react";
import { Form } from "@webiny/form";
import { CmsEditorFieldRendererPlugin } from "@webiny/app-headless-cms/types";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CircularProgress } from "@webiny/ui/Progress";
import { getPlugins } from "@webiny/plugins";
import RenderFieldElement from "./ContentFormRender/RenderFieldElement";
import styled from "@emotion/styled";

const FormWrapper = styled("div")({
    height: "70vh",
    overflow: "auto"
});

export const ContentFormRender = ({
    getFields,
    getDefaultValues,
    loading = false,
    content,
    contentModel,
    onSubmit,
    onChange,
    locale,
    onForm = null
}) => {
    // All form fields - an array of rows where each row is an array that contain fields.
    const fields = getFields();
    const ref = useRef(null);

    useEffect(() => {
        typeof onForm === "function" && onForm(ref.current);
    }, []);

    const renderPlugins = useMemo(
        () => getPlugins<CmsEditorFieldRendererPlugin>("cms-editor-field-renderer"),
        []
    );

    return (
        <Form
            onChange={onChange}
            onSubmit={onSubmit}
            data={content ? content : getDefaultValues()}
            ref={ref}
        >
            {({ Bind }) => (
                <FormWrapper data-testid={"cms-content-form"}>
                    {loading && <CircularProgress />}
                    <Grid>
                        {/* Let's render all form fields. */}
                        {fields.map((row, rowIndex) => (
                            <React.Fragment key={rowIndex}>
                                {row.map(field => (
                                    <Cell span={Math.floor(12 / row.length)} key={field._id}>
                                        <RenderFieldElement
                                            field={field}
                                            Bind={Bind}
                                            locale={locale}
                                            renderPlugins={renderPlugins}
                                            contentModel={contentModel}
                                        />
                                    </Cell>
                                ))}
                            </React.Fragment>
                        ))}
                    </Grid>
                </FormWrapper>
            )}
        </Form>
    );
};
