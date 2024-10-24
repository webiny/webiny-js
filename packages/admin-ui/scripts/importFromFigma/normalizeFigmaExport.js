const aliasTokensExport = require("./exports/Alias tokens.json");
const { figmaRgbaToHsla } = require("./figmaRgbaToHsla");

const VARIABLE_TYPES = [
    "backgroundColor",
    "borderColor",
    "textColor",
    "padding",
    "elevation",
    "fill",
    "spacing",
    "margin",
    "borderRadius",
    "dimension",
    "borderWidth"
];

const getVariableType = variableName => {
    for (const type of VARIABLE_TYPES) {
        if (variableName.startsWith(type + "/")) {
            return type;
        }
    }

    throw new Error(`Unknown variable type for variable "${variableName}".`);
};

const normalizeFigmaExport = () => {
    return aliasTokensExport.variables
        .map(variable => {
            const { aliasName, resolvedValue } = variable.resolvedValuesByMode["37:2"];

            const [, variantName] = variable.name.match(/[a-zA-Z]*?\/[a-zA-Z]*?-(.*)/);

            const type = getVariableType(variable.name);

            return {
                type,
                name: variable.name,
                aliasName,
                hsla: figmaRgbaToHsla(resolvedValue),
                variantName,
                resolvedValue
            };
        })
        .sort((variable1, variable2) => {
            // Order by variable.name, from A to Z.
            return variable1.name.localeCompare(variable2.name);
        });
};

module.exports = { normalizeFigmaExport };
