import { Context } from "@webiny/api/types";
import { FileNormalizer } from "~/utils/FileNormalizer";
import { createModifierFromPlugins, FileUploadModifierPlugin } from "~/utils/FileUploadModifier";

export const createFileNormalizerFromContext = (context: Context) => {
    const modifierPlugins = context.plugins.byType<FileUploadModifierPlugin>(
        FileUploadModifierPlugin.type
    );

    return new FileNormalizer(createModifierFromPlugins(modifierPlugins));
};
