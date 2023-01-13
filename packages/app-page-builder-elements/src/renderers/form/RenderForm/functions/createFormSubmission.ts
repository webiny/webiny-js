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
    formSubmissionFieldValues,
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

    const variables = {
        revision: formData!.id,
        reCaptchaResponseToken,
        data: formSubmissionFieldValues,
        meta: { ip: await getClientIp() }
    };

    const response = await dataLoaders.submitForm({ variables });

    return {
        preview: false,
        data: null,
        error: response?.error
    };
};
