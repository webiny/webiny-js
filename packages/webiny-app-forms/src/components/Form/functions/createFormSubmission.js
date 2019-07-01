// @flow
import type { FormRenderComponentPropsType } from "webiny-app-forms/types";
import { CREATE_FORM_SUBMISSION } from "./graphql";
import getClientIp from "./getClientIp";
import { get } from "lodash";

type Args = {
    props: FormRenderComponentPropsType,
    data: Object
};

export default async ({ props: { data: form, client, preview }, data }: Args) => {
    if (preview) {
        return { preview: true, error: null, data: {} };
    }

    let response = await client.mutate({
        mutation: CREATE_FORM_SUBMISSION,
        variables: {
            id: form.id,
            data,
            meta: {
                ip: await getClientIp()
            }
        }
    });

    response = get(response, "data.forms.createFormSubmission");

    return {
        preview: false,
        data: {},
        error: response.error
    };
};
