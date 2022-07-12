import pluralize from "pluralize";

// This will make it so if the content model name is a single capitalized letter
// Ex. A, pluralizedTypeName will capitalize the name to As, instead of AS
export const pluralizedTypeName = (typeName: string): string => {
    let pluralizedTypeName;
    if (typeName.length === 1) {
        pluralizedTypeName = `${typeName}s`;
    } else {
        pluralizedTypeName = pluralize(typeName);
    }
    return pluralizedTypeName;
};
