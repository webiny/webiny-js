import type { ICollabThread } from "~/domain/thread/abstractions.js";
import type { ICollabLocatorResolution } from "~/domain/locator/abstractions.js";

/**
 * A thread paired with the current resolution of its anchor (existence, label, breadcrumb).
 * The anchor is computed at read time and never persisted.
 */
export interface ICollabThreadView {
    thread: ICollabThread;
    anchor: ICollabLocatorResolution;
}
