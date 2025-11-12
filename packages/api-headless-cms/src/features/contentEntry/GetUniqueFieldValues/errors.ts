import { BaseError } from "@webiny/feature/api";

type FieldNotSearchableErrorData = {
    fieldId: string;
};

export class FieldNotSearchableError extends BaseError<FieldNotSearchableErrorData> {
    override readonly code = "FIELD_NOT_SEARCHABLE" as const;

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
    override readonly code = "INVALID_WHERE_CONDITION" as const;

    constructor(message: string, where: Record<string, any>) {
        super({
            message,
            data: { where }
        });
    }
}
