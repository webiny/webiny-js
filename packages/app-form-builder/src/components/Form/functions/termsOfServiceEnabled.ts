import { get } from "lodash";
import { FbFormModel } from "../../../types";

export default (formData: FbFormModel) => {
    return get(formData, "settings.termsOfServiceMessage.enabled");
};
