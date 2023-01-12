import { FormSubmissionFieldValues, FormSubmissionResponse } from "../../types";

import getClientIp from "./getClientIp";
import { FormRenderProps } from "~/renderers/form/RenderForm";

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
            formSubmissionData[field.fieldId] = rawFormSubmissionFieldValues[field.fieldId];
        }
    });

    const variables = {
        revision: formData!.id,
        reCaptchaResponseToken,
        data: formSubmissionData,
        meta: { ip: await getClientIp() }
    };

    const response = await dataLoaders.submitForm({ variables });

    return {
        preview: false,
        data: null,
        error: response?.error
    };
};
