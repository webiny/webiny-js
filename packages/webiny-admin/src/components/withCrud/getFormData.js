// @flow
import { get } from "lodash";

const process = ({ data, form }: Object) => {
    const responseHandler = get(form, "get.response");
    if (!responseHandler) {
        return data;
    }

    if (typeof responseHandler === "function") {
        return responseHandler(data);
    }

    const responseHandlers = {
        data: get(responseHandler, "data"),
        error: get(responseHandler, "error")
    };

    const formData = { data: undefined, error: undefined };
    if (typeof responseHandlers.data === "function") {
        formData.data = responseHandlers.data(data);
    }

    if (typeof responseHandlers.error === "function") {
        formData.error = responseHandlers.error(data);
    }

    return formData;
};

const getFormData = ({ data, form }: Object) => {
    const formData = process({ data, form });
    return {
        data: get(formData, "data") || {},
        error: get(formData, "error") || null
    };
};

export default getFormData;
