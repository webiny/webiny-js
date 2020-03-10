import { get } from "lodash";
import  { FbFormModel } from "@webiny/app-headless-cms/types";

export default (formData: FbFormModel) => {
    return (
        get(formData, "settings.reCaptcha.enabled") &&
        get(formData, "settings.reCaptcha.settings.enabled")
    );
};
