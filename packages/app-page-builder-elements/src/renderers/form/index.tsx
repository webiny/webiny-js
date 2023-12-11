import React, { useState, useEffect, useRef, useMemo } from "react";
import { CreateFormParams, FormData } from "./types";
import FormRender from "./FormRender";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { GetFormDataLoaderVariables } from "./dataLoaders";

export type FormRenderer = ReturnType<typeof createForm>;

export interface FormElementData {
    settings: {
        formId?: string;
    };
}

export const createForm = (params: CreateFormParams) => {
    const { dataLoaders } = params;

    return createRenderer<{ headers?: Record<string, any> }>(({ headers }) => {
        const { getElement } = useRenderer();

        const element = getElement<FormElementData>();

        const formId = element.data.settings?.formId;
        const variables: GetFormDataLoaderVariables = { formId };

        const variablesHash = JSON.stringify({ variables, headers });

        // We want to trigger form data load immediately, and not within a `useEffect` hook.
        // This enables us to render the actual form in the initial component render, and not
        // in a subsequent one.
        const getFormDataLoad = useMemo(() => {
            return dataLoaders.getForm({ variables, headers });
        }, [variablesHash]);

        const preloadedFormData = useMemo(() => {
            return getFormDataLoad && "formId" in getFormDataLoad ? getFormDataLoad : null;
        }, [getFormDataLoad]);

        // The `preloadedFormData` initial state assignment will occur in the initial component render.
        const [formData, setFormData] = useState<FormData | null>(preloadedFormData);
        const [loading, setLoading] = useState<boolean>(!preloadedFormData);

        // Let's cache the data retrieved by the data loader and make the UX a bit smoother.
        const cache = useRef<Record<string, FormData>>({});

        useEffect(() => {
            if (preloadedFormData) {
                setFormData(preloadedFormData);
            }

            if (!variables.formId) {
                return;
            }

            const cached = cache.current[variablesHash];
            if (cached) {
                setFormData(cached);
            } else {
                if ("then" in getFormDataLoad) {
                    setLoading(true);
                    getFormDataLoad.then(formData => {
                        setFormData(formData);
                        cache.current[variablesHash] = formData;
                        setLoading(false);
                    });
                }
            }
        }, [variablesHash]);

        if (!variables.formId) {
            if (params.renderFormNotSelected) {
                return params.renderFormNotSelected({});
            }

            return <>Please select a form.</>;
        }

        if (loading) {
            if (params.renderFormLoading) {
                return params.renderFormLoading({});
            }
            return <>Loading selected form...</>;
        }

        if (!formData) {
            if (params.renderFormNotFound) {
                return params.renderFormNotFound({});
            }

            return <>Form not found.</>;
        }

        return <FormRender createFormParams={params} loading={loading} formData={formData} />;
    });
};
