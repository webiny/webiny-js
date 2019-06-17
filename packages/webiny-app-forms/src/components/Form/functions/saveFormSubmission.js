// @flow
import type { FormRenderComponentPropsType } from "webiny-app-forms/types";
import { SAVE_FORM_SUBMISSION } from "./graphql";
import getClientIp from "./getClientIp";
import { get } from "lodash";

export default async (
    { data: form, client, preview }: FormRenderComponentPropsType,
    data: Object
) => {
    if (!form) {
        // TODO: handle this?
        return;
    }

    if (preview) {
        return { preview: true, error: null, data: {} };
    }

    let response = await client.mutate({
        mutation: SAVE_FORM_SUBMISSION,
        variables: {
            id: form.id,
            data,
            meta: {
                ip: await getClientIp()
            }
        }
    });

    response = get(response, "data.forms.saveFormSubmission");

    return {
        preview: false,
        data: {},
        error: response.error
    };
};
