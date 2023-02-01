import React, { useState, useEffect, useRef, useMemo } from "react";
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

    return createRenderer(
        () => {
            const { getElement, getLoader } = useRenderer();

            const element = getElement<FormElementData>();
            const { data: formData, loading } = getLoader<FormData>();

            const form = element.data.settings?.form;

            const variables: GetFormDataLoaderVariables = {};
            if (form) {
                if (form.revision === "latest") {
                    variables.parent = form.parent;
                } else {
                    variables.revision = form.revision;
                }
            }

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
        },
        {
            loader: ({ element }) => {
                const form = element.data.settings?.form;
                if (!form) {
                    return null;
                }

                const { parent, revision } = form;
                if (!parent && !revision) {
                    return null;
                }

                if (form.revision === "latest") {
                    return dataLoaders.getForm({ variables: { parent: form.parent } });
                }

                return dataLoaders.getForm({ variables: { revision: form.revision } });
            }
        }
    );
};
