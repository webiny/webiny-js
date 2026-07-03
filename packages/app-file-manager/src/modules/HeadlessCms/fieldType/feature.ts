import { createFeature } from "@webiny/feature/admin";
import { FileFieldType } from "./FileFieldType.js";
import { FileFieldSettingsModifier } from "./FileFieldSettingsModifier.js";
import { FileInputRenderer } from "./FileInputRenderer.js";
import { FileInputsRenderer } from "./FileInputsRenderer.js";

export const FileFieldTypeFeature = createFeature({
    name: "FileFieldType",
    register(container) {
        container.register(FileFieldType);
        container.register(FileFieldSettingsModifier);
        container.register(FileInputRenderer);
        container.register(FileInputsRenderer);
    }
});
