import { FbFormRenderComponentProps, FormSubmitResponseType } from "~/types";

import {
    CREATE_FORM_SUBMISSION,
    CreateFormSubmissionMutationResponse,
    CreateFormSubmissionMutationVariables
} from "./graphql";
import getClientIp from "./getClientIp";
import { ApolloClient } from "apollo-client";

interface CreateFormSubmissionParams {
    client: ApolloClient<any>;
    props: FbFormRenderComponentProps;
    data: any;
    reCaptchaResponseToken: string;
}

export default async ({
    client,
    props: { data: form, preview },
    data: rawData,
    reCaptchaResponseToken
}: CreateFormSubmissionParams): Promise<FormSubmitResponseType> => {
    if (preview) {
        return {
            preview: true,
            error: null,
            data: null
        };
    }

    const data: Record<string, string> = {};
    if (!form) {
        return {
            error: {
                message: "Form data is missing.",
                code: "FORM_DATA_MISSING"
            },
            data: null,
            preview: false
        };
    }

    form.fields.forEach(field => {
        if (field.fieldId in rawData) {
            data[field.fieldId] = rawData[field.fieldId];
        }
    });

    let response: any = await client.mutate<
        CreateFormSubmissionMutationResponse,
        CreateFormSubmissionMutationVariables
    >({
        mutation: CREATE_FORM_SUBMISSION,
        variables: {
            revision: form.id,
            reCaptchaResponseToken,
            data,
            meta: {
                ip: await getClientIp()
            }
        }
    });

    response = response?.data?.formBuilder?.createFormSubmission;

    return {
        preview: false,
        data: null,
        error: response?.error
    };
};
