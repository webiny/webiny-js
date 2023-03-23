import { FormSubmissionFieldValues, FormSubmissionResponse } from "../../types";

import getClientIp from "./getClientIp";
import { FormRenderProps } from "~/renderers/form/FormRender";

interface CreateFormSubmissionParams {
    props: FormRenderProps;
    formSubmissionFieldValues: FormSubmissionFieldValues;
    reCaptchaResponseToken: string;
}

export default async ({
    props,
    formSubmissionFieldValues: rawFormSubmissionFieldValues,
    reCaptchaResponseToken
}: CreateFormSubmissionParams): Promise<FormSubmissionResponse> => {
    const { formData, createFormParams } = props;
    const { preview, dataLoaders } = createFormParams;

    if (preview) {
        return {
            preview: true,
            error: null,
            data: null
        };
    }

    const formSubmissionData: Record<string, string> = {};

    formData!.fields.forEach(field => {
        if (field.fieldId in rawFormSubmissionFieldValues) {
            if (
                field.type === "radio" &&
                field.settings.otherOption &&
                rawFormSubmissionFieldValues[field.fieldId] === "other"
            ) {
                // If user picked "other" radio button,
                // then we need to replace value with the one typed in the input field
                formSubmissionData[field.fieldId] = `Other: ${
                    rawFormSubmissionFieldValues[`${field.fieldId}Other`]
                }`;
            } else if (
                field.type === "checkbox" &&
                field.settings.otherOption &&
                rawFormSubmissionFieldValues[field.fieldId]?.some(
                    (value: string) => value === "other"
                )
            ) {
                // If user picked "other" checkbox,
                // then we need to replace value with the one typed in the input field
                const indexOfOther = rawFormSubmissionFieldValues[field.fieldId]?.indexOf("other");
                const newValuesArray = rawFormSubmissionFieldValues[field.fieldId];
                newValuesArray[indexOfOther] = `Other: ${
                    rawFormSubmissionFieldValues[`${field.fieldId}Other`]
                }`;

                formSubmissionData[field.fieldId] = newValuesArray;
            } else {
                formSubmissionData[field.fieldId] = rawFormSubmissionFieldValues[field.fieldId];
            }
        }
    });

    const query = new URLSearchParams(location.search);

    const variables = {
        revision: formData!.id,
        reCaptchaResponseToken,
        data: formSubmissionData,
        meta: {
            ip: await getClientIp(),
            submittedOn: new Date().toISOString(),
            url: {
                location: location.href,
                query: Object.fromEntries(query)
            }
        }
    };

    const response = await dataLoaders.submitForm({ variables });

    return {
        preview: false,
        data: null,
        error: response?.error
    };
};
