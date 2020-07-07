import slugify from "slugify";

const toSlug = text =>
    slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });

export default toSlug;
