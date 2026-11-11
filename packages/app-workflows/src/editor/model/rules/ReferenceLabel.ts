// What a saved reference points at: a user, a team (a rule's, not the step's own) or a folder.
export type ReferenceKind = "user" | "team" | "folder";

// `found` resolved by name, `deleted` the lookup says it does not exist, `restricted` a folder that exists but the admin cannot see (D69, D117).
export type ReferenceState = "found" | "deleted" | "restricted";

export interface ReferenceLabel {
    id: string;
    label: string;
    state: ReferenceState;
}
