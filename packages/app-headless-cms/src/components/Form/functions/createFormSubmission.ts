import { FbFormRenderComponentProps, FormSubmitResponseType } from "@webiny/app-headless-cms/types";

import { CREATE_CONTENT_MODEL_SUBMISSION } from "./graphql";
import { get } from "lodash";
import { ApolloClient } from "apollo-client";

type Args = {
    client: ApolloClient<any>;
    props: FbFormRenderComponentProps;
    data: any;
};

export default async ({
    client,
    props: { data: form, preview },
    data: rawData,
}: Args): Promise<FormSubmitResponseType> => {
    if (preview) {
        return { preview: true, error: null, data: null };
    }

    const data = {};
    if (!form) {
        return {
            error: { message: "Form data is missing.", code: "CONTENT_MODEL_DATA_MISSING" },
            data: null,
            preview: false
        };
    }

    form.fields.forEach(field => {
        if (field.fieldId in rawData) {
            data[field.fieldId] = rawData[field.fieldId];
        }
    });

    let response: any = await client.mutate({
        mutation: CREATE_CONTENT_MODEL_SUBMISSION,
        variables: {
            id: form.id,
            data
        }
    });

    response = get(response, "data.cmsManage.createFormSubmission");

    return {
        preview: false,
        data: null,
        error: response.error
    };
};
