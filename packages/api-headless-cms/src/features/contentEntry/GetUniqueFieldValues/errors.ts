import { BaseError } from "@webiny/feature/api";

type FieldNotSearchableErrorData = {
    fieldId: string;
};

export class FieldNotSearchableError extends BaseError<FieldNotSearchableErrorData> {
    override readonly code = "Cms/Entry/FieldNotSearchable" as const;

    constructor(fieldId: string) {
        super({
            message: `Cannot list unique entry field values if the field "${fieldId}" is not searchable.`,
            data: { fieldId }
        });
    }
}

type InvalidWhereConditionErrorData = {
    where: Record<string, any>;
};

export class InvalidWhereConditionError extends BaseError<InvalidWhereConditionErrorData> {
    override readonly code = "Cms/Entry/InvalidWhereCondition" as const;

    constructor(message: string, where: Record<string, any>) {
        super({
            message,
            data: { where }
        });
    }
}
