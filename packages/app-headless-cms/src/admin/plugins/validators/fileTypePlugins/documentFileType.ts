import { CmsFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsFieldValidatorFileTypePlugin";

// const documentRegex = new RegExp(/(?!(\.(gif|jpe?g|tiff?|png|webp|bmp)))$/, "i");

export const documentFileTypeValidator = new CmsFieldValidatorFileTypePlugin({
    name: "image"
    // regex: documentRegex
});
