import React, { useCallback, useEffect, useRef } from "react";
import RenderFieldElement from "./RenderFieldElement";
import styled from "@emotion/styled";
import { Form } from "@webiny/form";
import { FormAPI, FormRenderPropParams } from "@webiny/form/types";
import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import { CmsContentFormRendererPlugin } from "~/types";
import { useContentEntryForm, UseContentEntryFormParams } from "./useContentEntryForm";
import { Fields } from "./Fields";
import { Prompt } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin";

const FormWrapper = styled("div")({
    height: "calc(100vh - 260px)",
    overflow: "auto"
});

interface ContentEntryFormProps extends UseContentEntryFormParams {
    onForm?: (form: FormAPI) => void;
}

function omitTypename(key: string, value: string): string | undefined {
    return key === "__typename" ? undefined : value;
}

const stringify = (value: any): string => {
    return JSON.stringify(value || {}, omitTypename);
};

const isDifferent = (value: any, compare: any): boolean => {
    if (!value && !compare) {
        return false;
    }
    return stringify(value) !== stringify(compare);
};

export const ContentEntryForm: React.FC<ContentEntryFormProps> = ({ onForm, ...props }) => {
    const formElementRef = useRef<HTMLDivElement>(null);
    const { contentModel } = props;
    const {
        loading,
        data: initialData,
        onChange,
        onSubmit,
        invalidFields
    } = useContentEntryForm(props);

    const [isDirty, setIsDirty] = React.useState<boolean>(false);
    /**
     * Reset isDirty when the loaded data changes.
     */
    useEffect(() => {
        if (!isDirty) {
            return;
        }
        setIsDirty(false);
    }, [initialData]);

    const { showSnackbar } = useSnackbar();

    const ref = useRef<FormAPI | null>(null);

    useEffect(() => {
        if (typeof onForm !== "function" || !ref.current) {
            return;
        }
        onForm(ref.current);
    }, []);

    useEffect(() => {
        if (!formElementRef.current) {
            return;
        }

        formElementRef.current.scrollTo(0, 0);
    }, [initialData.id, formElementRef.current]);

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
                contentModel,
                fields,
                /**
                 * TODO @ts-refactor
                 * Figure out type for Bind.
                 */
                Bind: formRenderProps.Bind as any
            });
        },
        [formRenderer]
    );

    const onFormSubmit = useCallback(
        (data, form) => {
            setIsDirty(false);
            return onSubmit(data, form);
        },
        [onSubmit]
    );

    const onFormInvalid = useCallback(() => {
        setIsDirty(true);
        showSnackbar("You have fields that did not pass the validation. Please check the form.");
    }, []);

    const onFormChange = useCallback(
        (data, form) => {
            const different = isDifferent(data, initialData);
            if (isDirty !== different) {
                setIsDirty(different);
            }
            return onChange(data, form);
        },
        [onChange, initialData]
    );

    return (
        <Form
            onChange={onFormChange}
            onSubmit={onFormSubmit}
            data={initialData}
            ref={ref}
            invalidFields={invalidFields}
            onInvalid={onFormInvalid}
        >
            {formProps => {
                return (
                    <>
                        <Prompt
                            when={isDirty}
                            message={
                                "There are some unsaved changes! Are you sure you want to navigate away and discard all changes?"
                            }
                        />
                        <FormWrapper data-testid={"cms-content-form"} ref={formElementRef}>
                            {loading && <CircularProgress />}
                            {formRenderer ? (
                                renderCustomLayout(formProps)
                            ) : (
                                <Fields
                                    contentModel={contentModel}
                                    fields={contentModel.fields || []}
                                    layout={contentModel.layout || []}
                                    {...formProps}
                                    Bind={formProps.Bind as any}
                                />
                            )}
                        </FormWrapper>
                    </>
                );
            }}
        </Form>
    );
};
