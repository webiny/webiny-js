/**
 * What the user has on screen when they ask, sent by the admin with each question. `view` says what
 * the screen is ("Entries of the Product content model"); `details` holds the ids and titles on it
 * that a question might refer to ("this folder", "Archive", "these entries").
 *
 * It is the user's own admin describing itself to the user's own assistant, so it grants nothing:
 * every tool still runs under the user's permissions, and a change still waits for approval with
 * its real arguments on screen.
 */
export interface AdminAssistantPageContext {
    view: string;
    details: Record<string, unknown>;
}

const MAX_VIEW_LENGTH = 200;

/** Ids and titles fit easily; anything bigger is a view sending record contents, which it should not. */
const MAX_DETAILS_LENGTH = 4000;

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Reads the page context from a request body. Anything malformed or too big is dropped rather than
 * refused: the question is still worth answering, only without the hint.
 */
export const parsePageContext = (value: unknown): AdminAssistantPageContext | undefined => {
    if (!isRecord(value)) {
        return undefined;
    }

    const view = value["view"];
    if (typeof view !== "string" || !view.trim() || view.length > MAX_VIEW_LENGTH) {
        return undefined;
    }

    const details = isRecord(value["details"]) ? value["details"] : {};
    const serialized = JSON.stringify(details);
    if (serialized.length > MAX_DETAILS_LENGTH) {
        return { view, details: {} };
    }

    return { view, details };
};

/**
 * The system prompt section for the page context. In the system prompt rather than the saved
 * messages, so it always describes the screen the latest question was asked from, and a reopened
 * chat does not carry a page the user has long left.
 */
export const describePageContext = (context: AdminAssistantPageContext): string => {
    const lines = ["### Where the user is", "", `The user is looking at: ${context.view}.`];

    if (Object.keys(context.details).length > 0) {
        lines.push("", "On screen:", JSON.stringify(context.details, null, 2));
    }

    lines.push(
        "",
        'Resolve "this", "here", "these" and names the user mentions (a folder, a model, an entry) against this screen first, and use its ids directly instead of looking them up again. Only search wider when nothing on screen matches.'
    );

    return lines.join("\n");
};
