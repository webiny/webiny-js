import type { AiChatSummary } from "~/api/features/AiChats/domain/types.js";
import type { PendingApproval } from "./approvals.js";

/**
 * What the assistant emits while it works.
 *
 * Deliberately a small, purpose-built set rather than the AI SDK's UI-message protocol: the client is
 * a command palette, not a chat framework, and it needs one thing the SDK protocol does not model for
 * us — the approval pause. Keeping our own events also means the admin bundle carries no AI SDK code.
 *
 * Transport-free by design. A transport frames these (as SSE, as newline JSON, as a CLI render); the
 * feature only says what happened.
 */
export type AdminAssistantEvent =
    /** The run is going ahead. Names the model, fully qualified, for the palette footer. */
    | { type: "start"; model: string }
    /** A fragment of the answer. Concatenate in arrival order. */
    | { type: "text"; text: string }
    /** A tool started running. Named so the UI can show work in progress, not just a spinner. */
    | { type: "tool-call"; name: string }
    /** A tool finished. Pairs with `tool-call` by name. */
    | { type: "tool-result"; name: string }
    /**
     * A tool threw. Also pairs with `tool-call` by name, and is NOT terminal: the model reads the
     * message and usually corrects itself on the next step, which is why tools report failure by
     * throwing. Without this the call would have no outcome and its chip would spin forever.
     */
    | { type: "tool-error"; name: string; message: string }
    /**
     * Questions the model suggests asking next. Sent once, at the end of a run that is not waiting
     * on an approval. The `suggestFollowUps` call behind it emits no tool events.
     */
    | { type: "follow-ups"; questions: string[] }
    /** The loop paused: these calls change something and need a human decision. */
    | { type: "approval"; approvals: PendingApproval[] }
    /**
     * The run was stored in the chat, a new one on the first question. Its id is what the next
     * question, or the decision on an approval, continues from.
     */
    | { type: "saved"; chat: AiChatSummary }
    /**
     * The run finished but could not be stored, so the next question will not see it. `too-large`
     * cannot succeed on a retry; anything else might.
     */
    | { type: "not-saved"; message: string; reason: "too-large" | "rejected" }
    /** Terminal success, after `saved` or `not-saved`. */
    | { type: "done"; steps: number }
    /**
     * Terminal failure. The run produced no usable answer. `code` is set only for a failure the
     * client handles on its own: a project with no model set up, which it shows as a setup screen.
     */
    | { type: "error"; message: string; code?: "AI_CAPABILITY_NOT_CONFIGURED" };
