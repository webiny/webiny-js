import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { formatUntilLabel } from "~/settings/model/time/formatUntilLabel.js";
import { formatUntilTitle } from "~/settings/model/time/formatUntilTitle.js";
import { isExclusionActive } from "~/settings/model/time/isExclusionActive.js";
import type { ExclusionRowVm } from "./abstractions.js";
import type { ExclusionUserName } from "./ExclusionsSource.js";
import { DELETED_USER_SUB_LINE } from "./exclusionUserCopy.js";

const NO_REASON = "No reason given";

/*
 * One table row (R323): the user's label (muted with a sub line when deleted), the reason or
 * `No reason given`, the until label and hover in the viewer's zone, the status at `now`, and the
 * accessible names of the row actions.
 */
export const buildExclusionRowVm = (
    exclusion: WorkflowExclusion,
    name: ExclusionUserName,
    now: number,
    timeZone: string
): ExclusionRowVm => {
    const active = isExclusionActive(exclusion, now);
    const deleted = name.state === "deleted";

    let subLine: string | null = null;
    if (deleted) {
        subLine = DELETED_USER_SUB_LINE;
    }

    let reason = NO_REASON;
    let reasonMuted = true;
    if (exclusion.reason !== null && exclusion.reason !== "") {
        reason = exclusion.reason;
        reasonMuted = false;
    }

    const untilLabel = formatUntilLabel(exclusion.endsOn, timeZone);
    const untilTitle = formatUntilTitle(exclusion.endsOn, timeZone);

    return {
        userId: exclusion.userId,
        label: name.label,
        muted: deleted,
        subLine,
        reason,
        reasonMuted,
        untilLabel,
        untilTitle,
        status: active ? "active" : "expired",
        statusLabel: active ? "Active" : "Expired",
        editLabel: `Edit exclusion for ${name.label}`,
        removeLabel: `Remove exclusion for ${name.label}`
    };
};
