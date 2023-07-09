import get from "lodash/get";
import { FbFormModel } from "~/types";

export default (formData: FbFormModel): boolean => {
    return get(formData, "settings.termsOfServiceMessage.enabled") || false;
};
