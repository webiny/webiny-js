/**
 * Dedicated hotkey layer for the command palette. `useHotkeys` only fires handlers
 * registered on the current top-most zIndex, so the palette owns its own layer.
 * NOTE: components that register a higher zIndex while open will shadow `mod+k`.
 * Layering interplay is revisited in a later phase.
 */
export const PALETTE_HOTKEY_ZINDEX = 90;

export const NAVIGATION_GROUP = "Navigation";

/** The `category` of the assistant's commands, which the palette lists first. */
export const ASSISTANT_GROUP = "Assistant";

/*
 * Where a model for the assistant is chosen. The route belongs to `@webiny/ai-powerups`, which core
 * admin cannot import, so the path is repeated here.
 */
export const AI_SETTINGS_PATH = "/settings/ai-powerups";
