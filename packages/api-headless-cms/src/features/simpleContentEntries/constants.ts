/**
 * Presence of this tag in `model.tags` designates a model as simple. A simple model is reachable
 * only through the simple entry operations, and a regular model only through the regular ones.
 */
export const SIMPLE_MODEL_TAG = "cms:simple";

/*
 * The storage operations read these four fields, so a simple entry has to carry them. They are
 * never anything other than the values below - there are no revisions and nothing is ever
 * published, so they are pinned rather than being state.
 */
export const SIMPLE_ENTRY_VERSION = 1 as const;
export const SIMPLE_ENTRY_STATUS = "draft" as const;
export const SIMPLE_ENTRY_LOCKED = false as const;
export const SIMPLE_ENTRY_EXPIRES_AT = null;
