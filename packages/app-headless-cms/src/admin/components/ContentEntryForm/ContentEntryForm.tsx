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
import { ModelProvider, useModel } from "~/admin/components/ModelProvider";

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
    const {
        loading,
        data: initialData,
        onChange,
        onSubmit,
        invalidFields
    } = useContentEntryForm(props);
    const { model } = useModel();

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

    const formRenderer = plugins
        .byType<CmsContentFormRendererPlugin>("cms-content-form-renderer")
        .find(pl => pl.modelId === model.modelId);

    const renderCustomLayout = useCallback(
        (formRenderProps: FormRenderPropParams) => {
            const fields = model.fields.reduce((acc, field) => {
                /**
                 * TODO @ts-refactor
                 * Figure out type for Bind.
                 */
                acc[field.fieldId] = (
                    <RenderFieldElement
                        field={field}
                        Bind={formRenderProps.Bind as any}
                        contentModel={model}
                    />
                );

                return acc;
            }, {} as Record<string, React.ReactElement>);
            if (!formRenderer) {
                return <>{`Missing form renderer for modelId "${model.modelId}".`}</>;
            }
            return formRenderer.render({
                ...formRenderProps,
                contentModel: model,
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

    return (
        <Form
            onChange={(data, form) => {
                const different = isDifferent(data, initialData);
                if (isDirty !== different) {
                    setIsDirty(different);
                }
                return onChange(data, form);
            }}
            onSubmit={(data, form) => {
                setIsDirty(false);
                return onSubmit(data, form);
            }}
            data={initialData}
            ref={ref}
            invalidFields={invalidFields}
            onInvalid={() => {
                setIsDirty(true);
                showSnackbar(
                    "You have fields that did not pass the validation. Please check the form."
                );
            }}
        >
            {formProps => {
                return (
                    <ModelProvider model={model}>
                        <Prompt
                            when={isDirty}
                            message={
                                "There are some unsaved changes! Are you sure you want to navigate away and discard all changes?"
                            }
                        />
                        <FormWrapper data-testid={"cms-content-form"}>
                            {loading && <CircularProgress />}
                            {formRenderer ? (
                                renderCustomLayout(formProps)
                            ) : (
                                <Fields
                                    contentModel={model}
                                    fields={model.fields || []}
                                    layout={model.layout || []}
                                    {...formProps}
                                    Bind={formProps.Bind as any}
                                />
                            )}
                        </FormWrapper>
                    </ModelProvider>
                );
            }}
        </Form>
    );
};
