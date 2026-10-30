import type { ReferenceKind } from "./ReferenceLabel.js";
import type { ReferenceLabel } from "./ReferenceLabel.js";
import type { ReferenceState } from "./ReferenceLabel.js";

const UNKNOWN_ITEM = "Unknown item";
const RESTRICTED_FOLDER = "Restricted folder";

const DELETED_LABELS: Record<ReferenceKind, string> = {
    user: "Deleted user",
    team: "Deleted team",
    folder: "Deleted folder"
};

export interface ReferenceLabelParams {
    kind: ReferenceKind;
    id: string;
    // The user's or team's name, the folder's path; `null` when the lookup gave none.
    name: string | null;
    state: ReferenceState;
}

/*
 * The label of a saved reference per state (R298, D117): the name when found, `Deleted user`,
 * `Deleted team` or `Deleted folder` when the lookup says it is gone, `Restricted folder` for a
 * folder the admin cannot see (its name is never shown). The muted look and the icon belong to the
 * picker option mapper.
 */
export const getReferenceLabel = (params: ReferenceLabelParams): ReferenceLabel => {
    if (params.state === "restricted") {
        return { id: params.id, label: RESTRICTED_FOLDER, state: params.state };
    }
    if (params.state === "deleted") {
        return { id: params.id, label: DELETED_LABELS[params.kind], state: params.state };
    }
    const label = params.name === null ? UNKNOWN_ITEM : params.name;

    return { id: params.id, label, state: params.state };
};
