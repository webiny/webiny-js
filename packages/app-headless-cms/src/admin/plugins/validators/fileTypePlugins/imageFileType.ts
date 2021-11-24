import { CmsFieldValidatorFileTypePlugin } from "~/admin/plugins/definitions/CmsFieldValidatorFileTypePlugin";

// const imageRegex = new RegExp(/.(gif|jpe?g|tiff?|png|webp|bmp)$/, "i");

export const imageFileTypeValidator = new CmsFieldValidatorFileTypePlugin({
    name: "image"
    // regex: imageRegex
});
