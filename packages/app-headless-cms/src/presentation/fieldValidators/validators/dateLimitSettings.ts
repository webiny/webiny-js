import { z } from "zod";
import { parseDateExpression, type DateExpressionUnit } from "@webiny/utils";
import type { FormModel, FormModelFactory } from "@webiny/app-admin";
import type { CmsModelField } from "~/types.js";
import type { ICmsFieldValidatorFormBuilder, ICmsFieldValidatorContext } from "../abstractions.js";

/**
 * The settings form of the `dateGte`/`dateLte` validators. On a date-only field, a limit is a
 * fixed date or relative to today: a number, a unit and a direction, which the form turns into
 * a date expression (`today-18y`) when the field is saved, and back when it's opened.
 */

type DateLimitDirection = "before" | "after";

interface DateLimitFormOptions {
    /** The Value field's description, for a fixed limit. */
    valueDescription: string;
}

const isDateOnly = (field: Pick<CmsModelField, "settings">): boolean => {
    const type = field.settings ? field.settings.type : "date";
    return !type || type === "date";
};

/**
 * The field's Format as it is in the open dialog, which can differ from the saved one on a new
 * field. Only date/time fields have it, and `form.field()` throws for a path the form doesn't
 * have.
 */
const isLiveDateOnly = (form: FormModel.Interface): boolean => {
    try {
        const type = form.field("general.settingsType").getValue();
        return typeof type !== "string" || type === "date";
    } catch {
        return true;
    }
};

const isRelative = ({ field, form }: FormModel.CallbackParams): boolean =>
    isLiveDateOnly(form) && field.parent().field("mode").getValue() === "relative";

export function buildDateLimitSettingsForm(
    form: ICmsFieldValidatorFormBuilder,
    context: ICmsFieldValidatorContext,
    options: DateLimitFormOptions
): void {
    const type = context.field.settings ? context.field.settings.type : "date";
    const relativeAllowed = isDateOnly(context.field);

    form.fields((fields): Record<string, FormModelFactory.FieldBuilder> => {
        const valueField = fields.datetime().label("Value").description(options.valueDescription);

        switch (type) {
            case "time":
                valueField.timeOnly();
                break;
            case "dateTimeWithTimezone":
                valueField.withTimezone();
                break;
            case "dateTimeWithoutTimezone":
                valueField.withoutTimezone();
                break;
            default:
                valueField.dateOnly();
                break;
        }

        if (!relativeAllowed) {
            return { value: valueField };
        }

        return {
            mode: fields
                .text()
                .label("Limit")
                .description(
                    "A date relative to today is worked out from the current date every time the value is checked."
                )
                .options([
                    { value: "fixed", label: "Fixed date" },
                    { value: "relative", label: "Relative to today" }
                ])
                .defaultValue("fixed")
                .hiddenWhen(({ form }: FormModel.CallbackParams) => !isLiveDateOnly(form)),
            value: valueField.hiddenWhen(isRelative),
            amount: fields
                .number()
                .label("Amount")
                .required("Enter a number.")
                .schema(z.number().int("Use a whole number.").min(0, "Use 0 or more."))
                .hiddenWhen(params => !isRelative(params)),
            unit: fields
                .text()
                .label("Unit")
                .options([
                    { value: "d", label: "Days" },
                    { value: "m", label: "Months" },
                    { value: "y", label: "Years" }
                ])
                .defaultValue("y")
                .hiddenWhen(params => !isRelative(params)),
            direction: fields
                .text()
                .label("Direction")
                .options([
                    { value: "before", label: "Before today" },
                    { value: "after", label: "After today" }
                ])
                .defaultValue("before")
                .hiddenWhen(params => !isRelative(params))
        };
    });

    form.layout(layout =>
        relativeAllowed
            ? [layout.row("mode"), layout.row("value"), layout.row("amount", "unit", "direction")]
            : [layout.row("value")]
    );
}

/** Stored settings (`{ value }` or `{ expression }`) as the settings form's values. */
export function dateLimitSettingsToForm(
    settings: Record<string, unknown>,
    context: ICmsFieldValidatorContext
): Record<string, unknown> {
    if (!isDateOnly(context.field)) {
        return settings;
    }
    const { expression, ...rest } = settings;
    const parsed = typeof expression === "string" ? parseDateExpression(expression) : null;
    if (!parsed) {
        return { ...rest, mode: "fixed", unit: "y", direction: "before" };
    }
    const direction: DateLimitDirection = parsed.amount > 0 ? "after" : "before";
    return {
        ...rest,
        mode: "relative",
        amount: Math.abs(parsed.amount),
        // Plain `today` parses as 0 days; years is the form's default unit.
        unit: parsed.amount === 0 ? "y" : parsed.unit,
        direction
    };
}

/** The settings form's values as stored settings: a fixed `value` or an `expression`. */
export function dateLimitSettingsFromForm(
    settings: Record<string, unknown>
): Record<string, unknown> {
    const { mode, amount, unit, direction, value, expression: _expression, ...rest } = settings;
    if (mode === "relative") {
        if (typeof amount !== "number") {
            return rest;
        }
        return {
            ...rest,
            expression: toDateExpression(
                amount,
                unit as DateExpressionUnit,
                direction as DateLimitDirection
            )
        };
    }
    return value == null ? rest : { ...rest, value };
}

/** `today`, or `today` plus or minus the amount: 18 years before today is `today-18y`. */
export function toDateExpression(
    amount: number,
    unit: DateExpressionUnit,
    direction: DateLimitDirection
): string {
    if (amount === 0) {
        return "today";
    }
    return `today${direction === "after" ? "+" : "-"}${amount}${unit}`;
}
