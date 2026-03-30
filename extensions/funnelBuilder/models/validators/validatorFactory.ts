import { FieldValidatorDto } from "./AbstractValidator";

import { registry } from "./registry";

export const validatorFromDto = (dto: FieldValidatorDto) => {
    const ValidatorClass = registry.find(validatorClass => validatorClass.type === dto.type);
    if (!ValidatorClass) {
        throw new Error(`Unknown validator: ${dto.type}`);
    }
    return new ValidatorClass(dto.params);
};
