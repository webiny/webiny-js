import { z } from "zod";
import type { CmsModelFieldValidator } from "~/types.js";

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

        switch (validator.name) {
            case "required":
                required = true;
                requiredMessage = validator.message;
                break;

            case "minLength":
                if (settings.value != null) {
                    schemas.push(
                        z.string().min(Number(settings.value), validator.message || undefined)
                    );
                }
                break;

            case "maxLength":
                if (settings.value != null) {
                    schemas.push(
                        z.string().max(Number(settings.value), validator.message || undefined)
                    );
                }
                break;

            case "pattern":
                if (settings.regex) {
                    const flags = settings.flags || "";
                    schemas.push(
                        z
                            .string()
                            .regex(
                                new RegExp(settings.regex, flags),
                                validator.message || undefined
                            )
                    );
                }
                break;

            case "gte":
                if (settings.value != null) {
                    schemas.push(
                        z.number().gte(Number(settings.value), validator.message || undefined)
                    );
                }
                break;

            case "lte":
                if (settings.value != null) {
                    schemas.push(
                        z.number().lte(Number(settings.value), validator.message || undefined)
                    );
                }
                break;

            case "in":
                if (Array.isArray(settings.values) && settings.values.length > 0) {
                    schemas.push(z.enum(settings.values as [string, ...string[]]));
                }
                break;

            case "dateGte":
                if (settings.value != null) {
                    const minDate = settings.value;
                    schemas.push(
                        z.string().refine(val => val >= minDate, {
                            message: validator.message || `Must be on or after ${minDate}`
                        })
                    );
                }
                break;

            case "dateLte":
                if (settings.value != null) {
                    const maxDate = settings.value;
                    schemas.push(
                        z.string().refine(val => val <= maxDate, {
                            message: validator.message || `Must be on or before ${maxDate}`
                        })
                    );
                }
                break;
        }
    }

    const schema =
        schemas.length === 0
            ? undefined
            : schemas.length === 1
              ? schemas[0]
              : z.intersection(
                    schemas[0],
                    schemas.slice(1).reduce((acc, s) => z.intersection(acc, s), schemas[0])
                );

    return { required, requiredMessage, schema: schemas.length <= 1 ? schema : undefined };
}
