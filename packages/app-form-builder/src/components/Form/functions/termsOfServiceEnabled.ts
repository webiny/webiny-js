// @flow
import { get } from "lodash";
import type { FormDataType } from "@webiny/app-form-builder/types";

export default (formData: FormDataType) => {
    return get(formData, "settings.termsOfServiceMessage.enabled");
};
