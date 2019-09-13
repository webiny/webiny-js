// @flow
import type { FormRenderComponentPropsType, FormSubmitResponseType } from "@webiny/app-forms/types";
import { CREATE_FORM_SUBMISSION } from "./graphql";
import getClientIp from "./getClientIp";
import { get } from "lodash";

type Args = {
    props: FormRenderComponentPropsType,
    data: Object,
    reCaptchaResponseToken: string
};

export default async ({
    client,
    props: { data: form, preview },
    data: rawData,
    reCaptchaResponseToken
}: Args): Promise<FormSubmitResponseType> => {
    if (preview) {
        return { preview: true, error: null, data: null };
    }

    const data = {};
    if (!form) {
        return {
            error: { message: "Form data is missing.", code: "FORM_DATA_MISSING" },
            data: null,
            preview: false
        };
    }

    form.fields.forEach(field => {
        if (field.fieldId in rawData) {
            data[field.fieldId] = rawData[field.fieldId];
        }
    });

    let response = await client.mutate({
        mutation: CREATE_FORM_SUBMISSION,
        variables: {
            id: form.id,
            reCaptchaResponseToken,
            data,
            meta: {
                ip: await getClientIp()
            }
        }
    });

    response = get(response, "data.forms.createFormSubmission");

    return {
        preview: false,
        data: null,
        error: response.error
    };
};
