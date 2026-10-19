import { FieldRendererConfigSchema } from "~/shared/adminExtensions/fieldRendererConfig.js";
import { parseJson } from "~/shared/adminExtensions/parseJson.js";
import { ADMIN_EXTENSION_RUNTIME_VERSION } from "~/shared/adminExtensions/constants.js";
import { toCmsRendererName } from "~/shared/adminExtensions/fieldRendererRuntime.js";
import type { AdminExtensionDto } from "~/shared/adminExtensions/types.js";
import type { FieldRendererEvaluator } from "~/admin/adminExtensions/features/fieldRendererRuntime/abstractions.js";
import type { EnabledExtensionsPresenter } from "./abstractions.js";

/**
 * Turns a stored field renderer into a component the form can use, or `null` when it cannot run
 * here: written for a newer runtime, a config that does not parse, or code that throws on load.
 */
export function toLoadedFieldRenderer(
    extension: AdminExtensionDto,
    evaluator: FieldRendererEvaluator.Interface
): EnabledExtensionsPresenter.FieldRenderer | null {
    if (extension.runtimeVersion > ADMIN_EXTENSION_RUNTIME_VERSION) {
        return null;
    }

    const config = FieldRendererConfigSchema.safeParse(parseJson(extension.config));
    if (!config.success || !extension.compiled) {
        return null;
    }

    try {
        const component = evaluator.evaluate(extension.compiled, extension.label);
        return {
            name: extension.name,
            label: extension.label,
            description: extension.description,
            config: config.data,
            cmsRendererName: toCmsRendererName(extension.name),
            formRendererName: `adminExtension.${extension.name}`,
            component
        };
    } catch (error) {
        console.warn(`[AdminExtensions] Field renderer "${extension.name}" did not load.`, error);
        return null;
    }
}
