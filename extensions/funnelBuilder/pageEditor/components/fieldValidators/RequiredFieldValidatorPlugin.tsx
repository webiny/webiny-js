import { FieldValidatorDefinition } from "./index";

export const requiredFieldValidator: FieldValidatorDefinition = {
    validatorType: "required",
    label: "Required",
    description: "You won't be able to submit the form if this field is empty"
};
