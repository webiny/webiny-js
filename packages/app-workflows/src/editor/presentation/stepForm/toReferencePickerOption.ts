import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import type { ReferenceKind } from "~/editor/model/rules/ReferenceLabel.js";
import type { ReferenceLabel } from "~/editor/model/rules/ReferenceLabel.js";

const FOUND_ICON: Record<ReferenceKind, PickerOptionIcon> = {
    user: "person",
    team: "group",
    folder: "folder"
};

/*
 * A saved reference as the option a picker shows for it (R298, D117). The label is the
 * `ReferenceLabel`'s (the name, or `Deleted user`, `Deleted team`, `Deleted folder`, `Restricted
 * folder`); this function adds how the state looks: a deleted user or team is muted with
 * `person_off` or `group_off`, a deleted folder is plain (design ED:772), a restricted folder is
 * muted and disabled with `lock`.
 */
export const toReferencePickerOption = (
    label: ReferenceLabel,
    kind: ReferenceKind
): PickerOption => {
    const base = { id: label.id, label: label.label, description: null, warning: null };

    if (label.state === "found") {
        return { ...base, muted: false, disabled: false, icon: FOUND_ICON[kind] };
    }
    if (label.state === "restricted") {
        return { ...base, muted: true, disabled: true, icon: "lock" };
    }
    if (kind === "user") {
        return { ...base, muted: true, disabled: false, icon: "person_off" };
    }
    if (kind === "team") {
        return { ...base, muted: true, disabled: false, icon: "group_off" };
    }
    return { ...base, muted: false, disabled: false, icon: null };
};
