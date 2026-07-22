import { createFeature } from "@webiny/feature/admin";
import { FileFieldType } from "./FileFieldType.js";
import { AssetFieldType } from "./AssetFieldType.js";
import { AssetFormFieldType } from "./AssetFormFieldType.js";
import { FileFieldSettingsModifier } from "./FileFieldSettingsModifier.js";
import { AssetFieldSettingsModifier } from "./AssetFieldSettingsModifier.js";
import { FileInputRenderer } from "./FileInputRenderer.js";
import { FileInputsRenderer } from "./FileInputsRenderer.js";
import { AssetInputRenderer } from "./AssetInputRenderer.js";
import { AssetInputsRenderer } from "./AssetInputsRenderer.js";

export const FileFieldTypeFeature = createFeature({
    name: "FileFieldType",
    register(container) {
        container.register(FileFieldType);
        container.register(AssetFieldType);
        container.register(AssetFormFieldType);
        container.register(FileFieldSettingsModifier);
        container.register(AssetFieldSettingsModifier);
        container.register(FileInputRenderer);
        container.register(FileInputsRenderer);
        container.register(AssetInputRenderer);
        container.register(AssetInputsRenderer);
    }
});
