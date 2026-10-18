import type { PickerOption } from "~/components/picker/PickerOption.js";
import { PICKER_LOADING_LABEL } from "~/components/picker/pickerTexts.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";

/*
 * What a picker shows for a saved id that no reference map knows (R298): while the resolution
 * runs, or after it failed, the neutral muted label `Searching…` under the id (the failure shows
 * the banner and a retry; the ids stay neutral until it resolves them); once the resolution
 * settled, null, and the picker shows `Unknown item` with `This item no longer exists.`.
 */
export const getUnresolvedReferenceOption = (
    id: string,
    references: StepFormReferencesOptions
): PickerOption | null => {
    if (!references.loading && !references.failed) {
        return null;
    }
    return {
        id,
        label: PICKER_LOADING_LABEL,
        description: null,
        warning: null,
        muted: true,
        disabled: false,
        icon: null
    };
};
