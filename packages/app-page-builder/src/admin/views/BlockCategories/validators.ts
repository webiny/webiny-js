export const blockCategorySlugValidator = (value: string): boolean => {
    if (value.match(/^[a-z]+(\-[a-z]+)*$/)) {
        return true;
    }

    throw new Error(
        "Block Category slug must consist of only 'a-z' and '-' characters (for example: 'block-category-slug')"
    );
};
