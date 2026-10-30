import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { ReferenceKind } from "~/editor/model/rules/ReferenceLabel.js";
import { getUnresolvedReferenceOption } from "./getUnresolvedReferenceOption.js";
import type { StepFormReferencesOptions } from "./StepFormOptions.js";
import { toReferencePickerOption } from "./toReferencePickerOption.js";

export interface ReferenceSelectionParams {
    id: string | null;
    kind: ReferenceKind;
    // The options a picker already knows: a pick, the search results, the chosen items.
    known: PickerOption[];
    references: StepFormReferencesOptions;
}

/*
 * The option a picker shows for a saved id (R298, D117): a known option first (a picked value is
 * known locally and is never re-resolved), else the resolved reference of its kind, else the
 * neutral label while unresolved, else null (the picker shows `Unknown item`).
 */
export const getReferenceSelection = (params: ReferenceSelectionParams): PickerOption | null => {
    const { id, kind, known, references } = params;
    if (id === null) {
        return null;
    }

    const option = known.find(item => item.id === id);
    if (option !== undefined) {
        return option;
    }

    let labels = references.users;
    if (kind === "team") {
        labels = references.teams;
    }
    if (kind === "folder") {
        labels = references.folders;
    }
    const label = labels.get(id);
    if (label !== undefined) {
        return toReferencePickerOption(label, kind);
    }

    return getUnresolvedReferenceOption(id, references);
};
