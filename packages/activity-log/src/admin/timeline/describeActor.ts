import { isRedactedActor, type TimelineActor } from "./types.js";

/** Which glyph a non-human writer gets. The component maps these to icons. */
export type MachineIcon = "key" | "task" | "system";

export interface DescribedActor {
    /**
     * `person` renders initials, `machine` renders an icon, `redacted` renders neither.
     *
     * A background task is a `person`, not a `machine`: tasks impersonate whoever started them, so
     * the name on the record is a real human's. The distinction the reader needs — that the person
     * was not at their desk — is carried by `via`, not by hiding their name.
     */
    kind: "person" | "machine" | "redacted";
    name: string;
    /** Up to two letters for the avatar. Empty unless `kind` is `person`. */
    initials: string;
    machineIcon: MachineIcon | null;
    /** Names the kind of writer, when it was not a person at a keyboard. */
    badge: string | null;
    /**
     * What actually ran, when something acted on a person's behalf.
     *
     * Deliberately says only what `source` supports. It cannot say who scheduled a publish and
     * when, how many entries a bulk operation touched, or which human owns an API key — none of
     * that is recorded. Guessing would be worse than the shorter sentence.
     */
    via: string | null;
}

/**
 * Initials from a display name: "Nina Kovač" becomes "NK".
 *
 * Falls back to the first two characters for a single-word name, and to an empty string for an
 * empty one — an avatar with a stray letter from an id would read as a real person's initial.
 */
export const initialsOf = (displayName: string): string => {
    const words = displayName.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return "";
    }

    if (words.length === 1) {
        return words[0]!.slice(0, 2).toUpperCase();
    }

    return (words[0]!.charAt(0) + words[words.length - 1]!.charAt(0)).toUpperCase();
};

const TASK_PREFIX = "task:";

/** A task definition id such as `cmsEntriesScheduledPublish`, made readable. */
const humaniseTaskId = (definitionId: string): string => {
    const spaced = definitionId
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .trim()
        .toLowerCase();

    return spaced === "" ? definitionId : spaced;
};

/**
 * Who or what made a change, and whether a person was actually present.
 *
 * This is the design's "not everything is a person" problem, answered with the data the recorder
 * actually captures: an ambient identity, and a `source` label resolved at write time. `source`
 * exists precisely because identity cannot answer it — a scheduled publish and a hand-clicked
 * publish arrive with the same identity, of the same type, because the task impersonates the user
 * who started it.
 */
export const describeActor = (params: { actor: TimelineActor; source: string }): DescribedActor => {
    const { actor, source } = params;

    if (isRedactedActor(actor)) {
        // The reader lacks actor identity. "Someone" rather than "Unknown": the system knows, the
        // reader is not permitted to, and those are different statements.
        return {
            kind: "redacted",
            name: "Someone",
            initials: "",
            machineIcon: null,
            badge: null,
            via: null
        };
    }

    const name = actor.displayName.trim() === "" ? actor.id : actor.displayName;

    if (source.startsWith(TASK_PREFIX)) {
        const definitionId = source.slice(TASK_PREFIX.length);

        return {
            kind: "person",
            name,
            initials: initialsOf(name),
            machineIcon: null,
            badge: "Automated",
            via: definitionId
                ? `Ran as a background task on ${name}'s behalf · ${humaniseTaskId(definitionId)}`
                : `Ran as a background task on ${name}'s behalf`
        };
    }

    if (source === "api-key") {
        return {
            kind: "machine",
            name,
            initials: "",
            machineIcon: "key",
            badge: "API key",
            // The actor *is* the key. Webiny records the key's name because a token holder is not
            // a person, and an agent using a token is indistinguishable from any other holder.
            via: "Written with an API key. The key's name is recorded, not a person's."
        };
    }

    if (source === "system") {
        return {
            kind: "machine",
            name: name === "" ? "Webiny" : name,
            initials: "",
            machineIcon: "system",
            badge: "System",
            via: "No signed-in user. An internal or infrastructure write."
        };
    }

    // Everything else is a signed-in identity type — "admin" for JWT/OIDC users, and whatever an
    // identity provider sets. No badge and no via line: a person at a keyboard is the default, and
    // badging it would put a label on nearly every row.
    return {
        kind: "person",
        name,
        initials: initialsOf(name),
        machineIcon: null,
        badge: null,
        via: null
    };
};
