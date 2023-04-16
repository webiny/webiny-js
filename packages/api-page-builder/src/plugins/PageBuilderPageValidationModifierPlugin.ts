import zod from "zod";
import { Plugin } from "@webiny/plugins";
import {
    createPageValidation,
    updatePageValidation,
    updatePageSettingsValidation
} from "~/graphql/crud/pages/validation";

export interface PageBuilderPageValidationModifierPluginParams {
    onCreate?: (
        schema: typeof createPageValidation
    ) => zod.infer<typeof createPageValidation & zod.Schema>;
    onUpdate?: (
        schema: typeof updatePageValidation
    ) => zod.infer<typeof updatePageValidation & zod.Schema>;
    onSettings?: (
        schema: typeof updatePageSettingsValidation
    ) => zod.infer<typeof updatePageSettingsValidation & zod.Schema>;
}

/**
 * Undocumented plugin - internal use only.
 */
export class PageBuilderPageValidationModifierPlugin extends Plugin {
    public static override readonly type: string = "pb.page.validation.modifier";

    private readonly options: PageBuilderPageValidationModifierPluginParams;

    public constructor(options: PageBuilderPageValidationModifierPluginParams) {
        super();
        this.options = options;
    }
}

export const createPageBuilderPageValidationModifierPluginParams = (
    options: PageBuilderPageValidationModifierPluginParams
) => {
    return new PageBuilderPageValidationModifierPlugin(options);
};
