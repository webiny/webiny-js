import slugify from "slugify";
import type { FormAPI } from "~/types.js";

/**
 * This hook is designed to be used with the `useForm` hook.
 * When `generateSlug` is called, it will generate a slug using the `from` form field, and set it into the `to` form field.
 * @param form
 * @param from
 * @param to
 */
export function useGenerateSlug(form: FormAPI, from: string, to = "slug") {
    const generateSlug = () => {
        const targetValue = form.getValue(to);
        const sourceValue = form.getValue(from);
        console.log("generateSlug", sourceValue, targetValue);
        if (targetValue || !sourceValue) {
            return;
        }

        // We want to update slug only when the folder is first being created.
        form.setValue(
            to,
            slugify(sourceValue, {
                replacement: "-",
                lower: true,
                remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g,
                trim: false
            })
        );
    };

    return { generateSlug };
}
