import slugify from "slugify";

export const toSlug = (text: string): string => {
    return slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });
};
