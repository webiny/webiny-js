import type { Context } from "@webiny/api/types.js";
import { FileNormalizer } from "./FileNormalizer.js";
import { createModifierFromPlugins } from "./FileUploadModifier.js";
import { FileUploadModifierPlugin } from "./FileUploadModifier.js";

export const createFileNormalizerFromContext = (context: Context) => {
    const modifierPlugins = context.plugins.byType<FileUploadModifierPlugin>(
        FileUploadModifierPlugin.type
    );

    return new FileNormalizer(createModifierFromPlugins(modifierPlugins));
};
