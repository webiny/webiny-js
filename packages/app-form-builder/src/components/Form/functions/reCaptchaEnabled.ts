import { get } from "lodash";
import { FbFormModel } from "../../../types";

export default (formData: FbFormModel) => {
    return (
        get(formData, "settings.reCaptcha.enabled") &&
        get(formData, "settings.reCaptcha.settings.enabled")
    );
};
