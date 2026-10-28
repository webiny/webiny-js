import WebinyError from "@webiny/error";
import { isDateExpression } from "@webiny/utils";
import type { CmsModelField } from "~/types/index.js";

const DATE_LIMIT_VALIDATORS = ["dateGte", "dateLte"];

/**
 * A `dateGte`/`dateLte` limit given as `{ expression }` must parse, and is allowed only on a
 * date-only field: on a time or datetime field, "today" has no single meaning.
 */
export const validateDateExpressions = (
    field: Pick<CmsModelField, "fieldId" | "type" | "settings" | "validation">
): void => {
    for (const validator of field.validation || []) {
        if (!DATE_LIMIT_VALIDATORS.includes(validator.name)) {
            continue;
        }
        const expression = validator.settings?.expression;
        if (expression === undefined || expression === null) {
            continue;
        }
        if (typeof expression !== "string" || !isDateExpression(expression)) {
            throw new WebinyError(
                `Field "${field.fieldId}" has an invalid date expression "${expression}" in its "${validator.name}" validator. Use "today", or "today" plus or minus a number of days, months or years, like "today-18y".`,
                "INVALID_DATE_EXPRESSION",
                { fieldId: field.fieldId, validator: validator.name, expression }
            );
        }
        if (field.type !== "datetime" || field.settings?.type !== "date") {
            throw new WebinyError(
                `Field "${field.fieldId}" uses a date expression in its "${validator.name}" validator, but expressions are only allowed on date-only fields.`,
                "DATE_EXPRESSION_NOT_ALLOWED",
                { fieldId: field.fieldId, validator: validator.name, expression }
            );
        }
    }
};
