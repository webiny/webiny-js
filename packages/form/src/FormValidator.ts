import lodashGet from "lodash/get";
import { FormField } from "./FormField";
import { FormValidationOptions, GenericFormData } from "~/types";
import { FieldValidationResult } from "~/FormFieldValidator";

interface FormValidationResult {
    isValid: boolean;
    invalidFields: {
        [name: string]: FieldValidationResult;
    };
}

export class FormValidator {
    private fields: FormField[];

    constructor(fields: FormField[]) {
        this.fields = fields;
    }

    async validate(
        data: GenericFormData,
        options?: FormValidationOptions
    ): Promise<FormValidationResult> {
        const fieldResults: Array<{ fieldName: string; validationResult: FieldValidationResult }> =
            [];

        await Promise.all(
            this.fields.map(async field => {
                const fieldName = field.getName();
                const fieldValue = lodashGet(data, fieldName);

                const validationResult = await this.validateField(
                    field,
                    fieldValue,
                    options?.skipValidators
                );
                fieldResults.push({ fieldName, validationResult });
            })
        );

        const invalidFields = fieldResults.filter(res => res.validationResult.isValid === false);

        return {
            isValid: invalidFields.length === 0,
            invalidFields: invalidFields.reduce(
                (acc, res) => ({ ...acc, [res.fieldName]: res.validationResult }),
                {}
            )
        };
    }

    private validateField(field: FormField, fieldValue: unknown, skipValidators: string[] = []) {
        const hasValue = fieldValue !== undefined;
        const isFieldValid = field.isValid();
        const shouldValidate = !hasValue || (hasValue && isFieldValid !== true);

        if (!shouldValidate) {
            return { isValid: true };
        }

        if (isFieldValid) {
            return { isValid: true };
        }

        return field.validate(fieldValue, { skipValidators });
    }
}
