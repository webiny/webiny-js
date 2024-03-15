import React, { useCallback, useEffect, useRef } from "react";
import { RenderFieldElement } from "./RenderFieldElement";
import styled from "@emotion/styled";
import { Form } from "@webiny/form";
import { FormAPI, FormRenderPropParams } from "@webiny/form/types";
import { plugins } from "@webiny/plugins";
import { CircularProgress } from "@webiny/ui/Progress";
import { CmsContentEntry, CmsContentFormRendererPlugin } from "~/types";
import { useContentEntryForm, UseContentEntryFormParams } from "./useContentEntryForm";
import { Fields } from "./Fields";
import { Prompt } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin";
import { ModelProvider, useModel } from "~/admin/components/ModelProvider";
import { ParentValueProvider } from "~/admin/components/ContentEntryForm/ParentValue";

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

export const ContentEntryForm = ({ onForm, ...props }: ContentEntryFormProps) => {
    const formElementRef = useRef<HTMLDivElement>(null);
    const { model } = useModel();
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
        .find(pl => pl.modelId === model.modelId);

    const renderCustomLayout = useCallback(
        (formRenderProps: FormRenderPropParams) => {
            const fields = model.fields.reduce((acc, field) => {
                acc[field.fieldId] = (
                    <RenderFieldElement
                        field={field}
                        /**
                         * TODO @ts-refactor
                         * Figure out type for Bind.
                         */
                        // @ts-expect-error
                        Bind={formRenderProps.Bind}
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
                // @ts-expect-error
                Bind: formRenderProps.Bind
            });
        },
        [formRenderer]
    );

    return (
        <Form<CmsContentEntry>
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
                showSnackbar("Some fields did not pass the validation. Please check the form.");
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
                        <FormWrapper data-testid={"cms-content-form"} ref={formElementRef}>
                            {loading && <CircularProgress />}
                            <ParentValueProvider value={formProps.data} name={"ContentEntry"}>
                                {formRenderer ? (
                                    renderCustomLayout(formProps)
                                ) : (
                                    <Fields
                                        contentModel={model}
                                        fields={model.fields || []}
                                        layout={model.layout || []}
                                        {...formProps}
                                        /**
                                         * TODO @ts-refactor
                                         * Figure out type for Bind.
                                         */
                                        // @ts-expect-error
                                        Bind={formProps.Bind}
                                    />
                                )}
                            </ParentValueProvider>
                        </FormWrapper>
                    </ModelProvider>
                );
            }}
        </Form>
    );
};
