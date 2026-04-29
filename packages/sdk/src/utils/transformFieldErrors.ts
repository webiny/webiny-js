/**
 * Transforms GraphQL field-selection and where-variable error messages into
 * user-friendly equivalents that avoid exposing internal GraphQL type names
 * (e.g. "FmFile", "FmFileListWhereInput").
 *
 * The regex patterns target error message formats defined by the GraphQL
 * specification, so they are stable across spec-compliant server implementations.
 */
export const transformFieldError = (message: string, fields: string[]): string => {
    // "Cannot query field "X" on type "Y"." — field does not exist in the selection
    const unknownMatch = message.match(/Cannot query field "([^"]+)" on type/);
    if (unknownMatch) {
        const fieldName = unknownMatch[1];
        const fullPath = fields.find(f => f.split(".").includes(fieldName));
        if (fullPath) {
            return `Unknown field: "${fullPath}" — "${fieldName}" does not exist.`;
        }
    }

    // 'Field "X" of type "Y" must have a selection of subfields.' — object used as a leaf
    const objectMatch = message.match(
        /Field "([^"]+)" of type "[^"]+" must have a selection of subfields/
    );
    if (objectMatch) {
        const fieldName = objectMatch[1];
        const fullPath = fields.find(f => f.split(".").includes(fieldName));
        if (fullPath) {
            return `Field "${fullPath}" is an object type and requires sub-field selection.`;
        }
    }

    // 'Variable "$where" got invalid value ... Field "X" is not defined by type "Y".' — unknown where filter key or operator
    const whereVarMatch = message.match(
        /Variable "\$where" got invalid value.*?Field "([^"]+)" is not defined by type/s
    );
    if (whereVarMatch) {
        return `Unknown filter field: "${whereVarMatch[1]}".`;
    }

    return message;
};
