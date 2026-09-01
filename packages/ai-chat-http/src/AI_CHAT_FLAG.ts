/**
 * Feature flag gating the in-admin AI assistant.
 *
 * Shared with the admin app, which hides the palette's AI mode behind the same name — gate one side
 * only and either the UI offers something the API refuses, or the endpoint stays open with no UI.
 */
export const AI_CHAT_FLAG = "aiChat";
