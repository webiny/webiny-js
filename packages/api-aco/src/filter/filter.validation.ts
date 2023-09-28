import zod from "zod";
import WebinyError from "@webiny/error";
import { Filter, Group, Operation } from "./filter.types";

interface ValidationErrorData {
    error: string;
    path: string;
}

const operationValidator = zod.enum([Operation.AND, Operation.OR]);

const filterValidationSchema = zod.object({
    field: zod.string().trim().nonempty("Field is required."),
    condition: zod.string().nonempty("Condition is required."),
    value: zod.union([
        zod.boolean(),
        zod.number({
            required_error: "Value is required.",
            invalid_type_error: "Value must be a number."
        }),
        zod.string().trim().nonempty("Value is required."),
        zod
            .array(zod.union([zod.boolean(), zod.number(), zod.string()]))
            .nonempty("Value is too short.")
    ])
});

const groupValidationSchema = zod.object({
    operation: operationValidator,
    filters: zod.array(filterValidationSchema).nonempty()
});

const validationSchema = zod.array(groupValidationSchema).nonempty();

export const validateFilterGroupsInput = (groups: Filter["groups"]) => {
    const parsedGroups: Group[] = groups.map(group => JSON.parse(group));
    const result = validationSchema.safeParse(parsedGroups);

    if (!result.success) {
        const data = result.error.issues.reduce((acc, issue) => {
            acc.push({
                error: issue.message || "",
                path: issue.path.join(".") || ""
            });

            return acc;
        }, [] as ValidationErrorData[]);

        throw new WebinyError("Validation failed.", "VALIDATION_FAILED", data);
    }
};
