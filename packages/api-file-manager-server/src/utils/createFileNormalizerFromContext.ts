import type { Context } from "@webiny/api/types.js";
import { FileNormalizer } from "~/utils/FileNormalizer.js";
import { createModifierFromPlugins, FileUploadModifierPlugin } from "~/utils/FileUploadModifier.js";

export const createFileNormalizerFromContext = (context: Context) => {
    const modifierPlugins = context.plugins.byType<FileUploadModifierPlugin>(
        FileUploadModifierPlugin.type
    );

    return new FileNormalizer(createModifierFromPlugins(modifierPlugins));
};
