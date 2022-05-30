export const blockCategorySlugValidator = (value: string): boolean => {
    if (!value.match(/^[a-z]+(\-[a-z]+)*$/)) {
        throw new Error(
            "Block Category slug must consist of only 'a-z' and '-' characters (for example: 'block-category-slug')"
        );
    }

    if (value.length > 100) {
        throw new Error("Block Category slug must shorter than 100 characters");
    }

    return true;
};
