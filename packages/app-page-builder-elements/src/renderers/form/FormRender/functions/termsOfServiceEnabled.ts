import { FormData } from "../../types";

export default (formData: FormData): boolean => {
    return formData?.settings?.termsOfServiceMessage?.enabled || false;
};
