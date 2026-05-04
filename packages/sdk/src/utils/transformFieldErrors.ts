/**
 * Transforms GraphQL field-selection and where-variable error messages into
 * user-friendly equivalents that avoid exposing internal GraphQL type names
 * (e.g. "FmFile", "FmFileListWhereInput").
 *
 * Uses global regex replaces rather than string splitting so that error messages
 * containing "; " internally (e.g. where-variable errors) are handled correctly
 * alongside multiple errors that are joined with "; ".
 *
 * The regex patterns target error message formats defined by the GraphQL
 * specification, so they are stable across spec-compliant server implementations.
 */
export const transformFieldErrors = (message: string, fields: string[]): string => {
    let result = message;

    // "Cannot query field "X" on type "Y"." — field does not exist in the selection
    result = result.replace(
        /Cannot query field "([^"]+)" on type [^.]+\./g,
        (_match, fieldName) => {
            const fullPath = fields.find(f => f.split(".").includes(fieldName));
            return fullPath
                ? `Unknown field: "${fullPath}" — "${fieldName}" does not exist.`
                : _match;
        }
    );

    // 'Field "X" of type "Y" must have a selection of subfields.' — object used as a leaf
    result = result.replace(
        /Field "([^"]+)" of type "[^"]+" must have a selection of subfields[^.]*\./g,
        (_match, fieldName) => {
            const fullPath = fields.find(f => f.split(".").includes(fieldName));
            return fullPath
                ? `Field "${fullPath}" is an object type and requires sub-field selection.`
                : _match;
        }
    );

    // 'Variable "$where" got invalid value ... Field "X" is not defined by type "Y".' — unknown where filter key or operator
    result = result.replace(
        /Variable "\$where" got invalid value.*?Field "([^"]+)" is not defined by type "[^"]+"\./gs,
        (_match, fieldName) => `Unknown filter field: "${fieldName}".`
    );

    return result;
};

/** Single-message variant used by FileManager methods. */
export const transformFieldError = (message: string, fields: string[]): string =>
    transformFieldErrors(message, fields);
