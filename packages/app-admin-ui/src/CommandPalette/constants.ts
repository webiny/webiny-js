/**
 * Dedicated hotkey layer for the command palette. `useHotkeys` only fires handlers
 * registered on the current top-most zIndex, so the palette owns its own layer.
 * NOTE: components that register a higher zIndex while open will shadow `mod+k`.
 * Layering interplay is revisited in a later phase.
 */
export const PALETTE_HOTKEY_ZINDEX = 90;

export const NAVIGATION_GROUP = "Navigation";

/** DI name of the "Ask AI" command, activated by pressing space on an empty query. */
export const AI_COMMAND_NAME = "admin.ai.ask";

/** Feature flag gating AI mode. Must match the API routes' flag. */
export const AI_CHAT_FLAG = "aiChat";
