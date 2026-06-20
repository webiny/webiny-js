import { createFeature } from "@webiny/feature/admin";
import { TextFieldType } from "./types/TextFieldType.js";

export const CmsFieldTypeFeature = createFeature({
    name: "CmsFieldTypes",
    register(container) {
        container.register(TextFieldType);
    }
});
