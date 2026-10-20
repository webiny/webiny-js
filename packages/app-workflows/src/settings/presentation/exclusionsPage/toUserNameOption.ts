import type { PickerOption } from "~/components/picker/PickerOption.js";
import type { PickerOptionIcon } from "~/components/picker/PickerOptionIcon.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";

/*
 * A user of the list as a picker option, for `Filter by user` and the locked User field of the
 * Edit dialog (R332, QBZ-91): a deleted user is muted with `person_off`.
 */
export const toUserNameOption = (
    name: ExclusionUserName,
    description: string | null
): PickerOption => {
    const deleted = name.state === "deleted";
    let icon: PickerOptionIcon = "person";
    if (deleted) {
        icon = "person_off";
    }
    return {
        id: name.userId,
        label: name.label,
        description,
        warning: null,
        muted: deleted,
        disabled: false,
        icon,
        note: null
    };
};
