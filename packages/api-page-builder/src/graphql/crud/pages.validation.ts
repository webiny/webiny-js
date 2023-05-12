import { createPageUpdateValidation, createPageSettingsUpdateValidation } from "./pages/validation";
import { PbContext } from "~/graphql/types";
import { ContextPlugin } from "@webiny/api";
import { createZodError } from "@webiny/utils";

export const createPageValidation = () => {
    return new ContextPlugin<PbContext>(async context => {
        context.pageBuilder.onPageBeforeUpdate.subscribe(async params => {
            const { page, original, input } = params;

            const updateValidationResult = await createPageUpdateValidation().safeParseAsync(input);
            if (!updateValidationResult.success) {
                throw createZodError(updateValidationResult.error);
            }

            const updateSettingsValidationResult =
                await createPageSettingsUpdateValidation().safeParseAsync({
                    ...original.settings,
                    ...page.settings
                });
            if (!updateSettingsValidationResult.success) {
                throw createZodError(updateSettingsValidationResult.error);
            }

            page.settings = Object.assign({}, page.settings, updateSettingsValidationResult.data);
        });
    });
};
