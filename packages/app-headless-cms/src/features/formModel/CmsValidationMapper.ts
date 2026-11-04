import { z } from "zod";
import type { DateBound } from "@webiny/utils";
import type { CmsModelFieldValidator } from "~/types.js";

function interpolateMessage(
    message: string | undefined,
    settings: Record<string, unknown>
): string | undefined {
    if (!message) {
        return undefined;
    }
    return message.replace(/\{(\w+)}/g, (match, key) => {
        const val = settings[key];
        return val != null ? String(val) : match;
    });
}

export function mapCmsValidators(
    validators: (CmsModelFieldValidator | { name: string })[] | undefined
): { required: boolean; requiredMessage?: string; schema: z.ZodTypeAny | undefined } {
    if (!validators || validators.length === 0) {
        return { required: false, schema: undefined };
    }

    let required = false;
    let requiredMessage: string | undefined;
    const schemas: z.ZodTypeAny[] = [];

    for (const v of validators) {
        const validator = v as CmsModelFieldValidator;
        const settings = validator.settings || {};

        const msg = interpolateMessage(validator.message, settings);

        switch (validator.name) {
            case "required":
                required = true;
                requiredMessage = msg;
                break;

            case "minLength":
                if (settings.value != null) {
                    schemas.push(z.string().min(Number(settings.value), msg || undefined));
                }
                break;

            case "maxLength":
                if (settings.value != null) {
                    schemas.push(z.string().max(Number(settings.value), msg || undefined));
                }
                break;

            case "pattern":
                if (settings.regex) {
                    const flags = settings.flags || "";
                    schemas.push(
                        z.string().regex(new RegExp(settings.regex, flags), msg || undefined)
                    );
                }
                break;

            case "gte":
                if (settings.value != null) {
                    schemas.push(z.number().gte(Number(settings.value), msg || undefined));
                }
                break;

            case "lte":
                if (settings.value != null) {
                    schemas.push(z.number().lte(Number(settings.value), msg || undefined));
                }
                break;

            case "in":
                if (Array.isArray(settings.values) && settings.values.length > 0) {
                    schemas.push(z.enum(settings.values as [string, ...string[]]));
                }
                break;

            // "dateGte" and "dateLte" are applied by `DateTimeFieldMapper`, through the
            // `datetime()` builder, which also hands the limits to the field's picker.
        }
    }

    const schema =
        schemas.length === 0
            ? undefined
            : schemas.slice(1).reduce<z.ZodTypeAny>((acc, s) => z.intersection(acc, s), schemas[0]);

    return { required, requiredMessage, schema };
}

/** The `dateGte`/`dateLte` validators, as limits for the `datetime()` builder. */
export function mapCmsDateLimits(
    validators: (CmsModelFieldValidator | { name: string })[] | undefined
): { name: "dateGte" | "dateLte"; bound: DateBound; message?: string }[] {
    const limits: { name: "dateGte" | "dateLte"; bound: DateBound; message?: string }[] = [];
    for (const v of validators || []) {
        const validator = v as CmsModelFieldValidator;
        if (validator.name !== "dateGte" && validator.name !== "dateLte") {
            continue;
        }
        const settings = validator.settings || {};
        const message = interpolateMessage(validator.message, settings);
        if (typeof settings.expression === "string") {
            limits.push({
                name: validator.name,
                bound: { expression: settings.expression },
                message
            });
        } else if (settings.value != null) {
            limits.push({ name: validator.name, bound: String(settings.value), message });
        }
    }
    return limits;
}

export function mapCmsListValidators(
    validators: (CmsModelFieldValidator | { name: string })[] | undefined
): { required: boolean; requiredMessage?: string; schema: z.ZodTypeAny | undefined } {
    if (!validators || validators.length === 0) {
        return { required: false, schema: undefined };
    }

    let required = false;
    let requiredMessage: string | undefined;
    let arraySchema = z.array(z.unknown());

    for (const v of validators) {
        const validator = v as CmsModelFieldValidator;
        const settings = validator.settings || {};
        const msg = interpolateMessage(validator.message, settings);

        switch (validator.name) {
            case "required":
                required = true;
                requiredMessage = msg;
                break;

            case "minLength":
                if (settings.value != null) {
                    arraySchema = arraySchema.min(
                        Number(settings.value),
                        msg || undefined
                    ) as typeof arraySchema;
                }
                break;

            case "maxLength":
                if (settings.value != null) {
                    arraySchema = arraySchema.max(
                        Number(settings.value),
                        msg || undefined
                    ) as typeof arraySchema;
                }
                break;
        }
    }

    const hasConstraints = validators.some(
        v =>
            (v as CmsModelFieldValidator).name === "minLength" ||
            (v as CmsModelFieldValidator).name === "maxLength"
    );

    return {
        required,
        requiredMessage,
        schema: hasConstraints ? arraySchema : undefined
    };
}
