// @flow
import { get } from "lodash";
import type { FormDataType } from "webiny-app-forms/types";

export default (formData: FormDataType) => {
    return get(formData, "settings.termsOfServiceMessage.enabled");
};
