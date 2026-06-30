import type { Context } from "@webiny/api/types.js";
import { FileNormalizer } from "~/utils/FileNormalizer.js";
import { createModifierFromPlugins, FileUploadModifier } from "~/utils/FileUploadModifier.js";

export const createFileNormalizerFromContext = (context: Context) => {
    // Modifiers are registered as DI instances (FileUploadModifier) — was
    // context.plugins.byType(FileUploadModifierPlugin.type).
    const modifierPlugins = context.container.resolveAll(FileUploadModifier);

    return new FileNormalizer(createModifierFromPlugins(modifierPlugins));
};
