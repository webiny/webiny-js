import primitiveTokensExport from "./exports/Primitives.json" with { type: "json" };
import { figmaRgbaToHsla } from "./figmaRgbaToHsla.js";

const INCLUDED_VARIABLE_TYPES = ["colors"];

// We don't need tokens that end with `-a{one or two numbers}` because they are used for
// alpha colors. We don't need these because we can use the /alpha function in Tailwind CSS.
const isColorWithAlpha = variantName => {
    return variantName.match(/^.*-a\d{1,2}$/);
};

const isIncludedVariableType = variableName => {
    for (const type of INCLUDED_VARIABLE_TYPES) {
        if (variableName.startsWith(type + "/")) {
            return true;
        }
    }

    return false;
};

const getVariableType = variableName => {
    for (const type of INCLUDED_VARIABLE_TYPES) {
        if (variableName.startsWith(type + "/")) {
            return type;
        }
    }

    throw new Error(`Unknown variable type for variable "${variableName}".`);
};

const normalizePrimitivesFigmaExport = () => {
    return primitiveTokensExport.variables
        .map(variable => {
            const resolvedValue = variable.valuesByMode["37:0"];

            const [, variantName] = variable.name.match(/[a-zA-Z]*?\/[a-zA-Z]*?-(.*)/);

            if (!isIncludedVariableType(variable.name)) {
                return null;
            }

            const type = getVariableType(variable.name);

            if (isColorWithAlpha(variantName)) {
                return null;
            }

            return {
                type,
                name: variable.name,
                hsla: figmaRgbaToHsla(resolvedValue),
                variantName,
                resolvedValue
            };
        })
        .filter(Boolean)
        .sort((variable1, variable2) => {
            // Order by variable.name, from A to Z.
            return variable1.name.localeCompare(variable2.name);
        });
};

export { normalizePrimitivesFigmaExport };
