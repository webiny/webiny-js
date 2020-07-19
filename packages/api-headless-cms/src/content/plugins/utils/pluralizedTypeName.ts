import pluralize from "pluralize";

// This will make it so if the content model name is a single capitalized letter
// Ex. A, pluralize will not capitalize the name to AS, and instead make it As

export const pluralizedTypeName = (typeName: string) => {
    let pluralizedTypeName;
    if (typeName.length === 1) {
        pluralizedTypeName = `${typeName}s`;
    } else {
        pluralizedTypeName = pluralize(typeName);
    }
    return pluralizedTypeName;
};
