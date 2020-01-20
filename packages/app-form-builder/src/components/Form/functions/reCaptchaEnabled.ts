// @flow
import { get } from "lodash";
import  { FormDataType } from "@webiny/app-form-builder/types";

export default (formData: FormDataType) => {
    return (
        get(formData, "settings.reCaptcha.enabled") &&
        get(formData, "settings.reCaptcha.settings.enabled")
    );
};
