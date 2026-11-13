import type { AdminAssistantPageContext } from "./abstractions.js";

/**
 * The system prompt section for the page context. In the system prompt rather than the saved
 * messages, so it always describes the screen the latest question was asked from, and a reopened
 * chat does not carry a page the user has long left.
 */
export const describePageContext = (context: AdminAssistantPageContext): string => {
    const lines = ["### Where the user is", "", `The user is looking at: ${context.view}.`];

    if (Object.keys(context.details).length > 0) {
        // Compact, the same size `parsePageContext` measured against its limit.
        const details = JSON.stringify(context.details);
        lines.push("", "On screen:", details);
    }

    lines.push(
        "",
        'Resolve "this", "here", "these" and names the user mentions (a folder, a model, an entry) against this screen first, and use its ids directly instead of looking them up again. Only search wider when nothing on screen matches.'
    );

    return lines.join("\n");
};
