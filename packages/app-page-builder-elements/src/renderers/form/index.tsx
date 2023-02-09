import React from "react";
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
            const { getLoader } = useRenderer();

            const { data, loading } = getLoader<[FormData, GetFormDataLoaderVariables]>();

            if (loading) {
                if (params.renderFormLoading) {
                    return params.renderFormLoading({});
                }
                return <>Loading selected form...</>;
            }

            const [formData, variables] = data;
            if (!variables.parent && !variables.revision) {
                if (params.renderFormNotSelected) {
                    return params.renderFormNotSelected({});
                }

                return <>Please select a form.</>;
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
            loader: async ({ getElement }) => {
                const element = getElement<FormElementData>();
                const form = element.data.settings?.form;
                if (!form) {
                    return [null, {}];
                }

                const { parent, revision } = form;
                if (!parent && !revision) {
                    return [null, {}];
                }

                if (revision === "latest") {
                    const variables = { parent };
                    const result = await dataLoaders.getForm({ variables });
                    return [result, variables];
                }

                const variables = { revision };
                const result = await dataLoaders.getForm({ variables });
                return [result, variables];
            }
        }
    );
};
