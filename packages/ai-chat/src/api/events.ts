import type { ModelMessage } from "ai";
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
export type AiChatEvent =
    /** A fragment of the answer. Concatenate in arrival order. */
    | { type: "text"; text: string }
    /** A tool started running. Named so the UI can show work in progress, not just a spinner. */
    | { type: "tool-call"; name: string }
    /** A tool finished. Pairs with `tool-call` by name. */
    | { type: "tool-result"; name: string }
    /** The loop paused: these calls change something and need a human decision. */
    | { type: "approval"; approvals: PendingApproval[] }
    /** Terminal success. Carries what the client must replay to resume after an approval. */
    | {
          type: "done";
          messages: ModelMessage[];
          steps: number;
          approvalsSigned: boolean;
      }
    /** Terminal failure. The run produced no usable answer. */
    | { type: "error"; message: string };
