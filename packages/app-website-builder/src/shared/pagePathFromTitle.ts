import slugify from "slugify";

export const pagePathFromTitle = (title: string = "") => {
    return slugify(title, {
        replacement: "-",
        lower: true,
        remove: /[*#?<>_{}[\]+~.()'"!:;@]/g,
        trim: false
    });
};
