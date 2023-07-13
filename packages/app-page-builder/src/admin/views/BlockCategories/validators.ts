export const blockCategorySlugValidator = (value: string): boolean => {
    if (!value.match(/^[a-z0-9]+(-[a-z0-9]+)*$/)) {
        throw new Error(
            "Block Category slug must consist of only 'a-z', '0-9' and '-' (for example: 'some-slug' or 'some-slug-2')"
        );
    }

    if (value.length > 100) {
        throw new Error("Block Category slug must shorter than 100 characters");
    }

    return true;
};

export const blockCategoryDescriptionValidator = (value: string): boolean => {
    if (value.length > 100) {
        throw new Error("Block Category description must be shorter than 100 characters");
    }

    return true;
};
