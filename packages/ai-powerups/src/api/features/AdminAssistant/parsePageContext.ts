import type { AdminAssistantPageContext } from "./abstractions.js";

const MAX_VIEW_LENGTH = 200;

/**
 * A list sends at most 30 rows and 30 folders, ids and titles cut to 60 characters, about 7000
 * characters in all. Anything bigger is a view sending record contents, which it should not.
 */
const MAX_DETAILS_LENGTH = 8000;

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
