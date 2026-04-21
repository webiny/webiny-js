/**
 * Transforms GraphQL field-selection error messages into user-friendly equivalents
 * that reference the original field paths the caller supplied, rather than internal
 * GraphQL type names (e.g. "FmFile").
 *
 * The regex patterns below target error message formats that are part of the GraphQL
 * specification, so they are stable across spec-compliant server implementations.
 */
export const transformFieldError = (message: string, fields: string[]): string => {
    // "Cannot query field "X" on type "Y"." — field does not exist on the type
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

    return message;
};
