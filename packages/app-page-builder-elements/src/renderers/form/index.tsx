import React, { useState, useEffect, useRef } from "react";
import { CreateFormParams, FormData } from "./types";
import FormRender from "./FormRender";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { GetFormDataLoaderVariables } from "./dataLoaders";

export type FormRenderer = ReturnType<typeof createForm>;

export interface FormElementData {
    settings: {
        form?: {
            parent?: string;
            revision?: string;
        };
    };
}

export const createForm = (params: CreateFormParams) => {
    const { dataLoaders } = params;

    return createRenderer(() => {
        const { getElement } = useRenderer();
        const [formData, setFormData] = useState<FormData | null>(null);
        const [loading, setLoading] = useState<boolean>(false);

        const element = getElement<FormElementData>();

        const form = element.data.settings?.form;
        const variables: GetFormDataLoaderVariables = {};
        if (form) {
            if (form.revision === "latest") {
                variables.parent = form.parent;
            } else {
                variables.revision = form.revision;
            }
        }

        // Let's cache the data retrieved by the data loader and make the UX a bit smoother.
        const cache = useRef<Record<string, FormData>>({});
        const variablesHash = JSON.stringify(variables);

        useEffect(() => {
            if (variables.parent || variables.revision) {
                const cached = cache.current[variablesHash];
                if (cached) {
                    setFormData(cached);
                } else {
                    setLoading(true);
                    dataLoaders.getForm({ variables }).then(formData => {
                        setFormData(formData);
                        cache.current[variablesHash] = formData;
                        setLoading(false);
                    });
                }
            }
        }, [variablesHash]);

        if (!(variables.parent || variables.revision)) {
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
