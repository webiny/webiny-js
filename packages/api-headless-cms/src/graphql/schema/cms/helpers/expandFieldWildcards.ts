import type { CmsContext, CmsModel } from "~/types/index.js";
import { ValuesSelectionGenerator } from "~/features/contentModel/ValuesSelectionGenerator/abstractions.js";

export const expandFieldWildcards = (
    fields: string[],
    model: CmsModel,
    context: CmsContext
): string[] => {
    if (!fields.includes("values.*")) {
        return fields;
    }

    const generator = context.container.resolve(ValuesSelectionGenerator);
    const valuesSelection = generator.generate(model);

    if (!valuesSelection || valuesSelection === "_empty") {
        return fields.filter(f => f !== "values.*");
    }

    const expanded = fields.filter(f => f !== "values.*");
    expanded.push(`values { ${valuesSelection} }`);
    return expanded;
};
