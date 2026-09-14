import type React from "react";
import type { Hint } from "../components/index.js";

/**
 * What a mode needs from the palette while it is handling a key.
 *
 * The palette owns the query and the input element, because there is ONE input row across every
 * mode and switching must not move or remount it. A mode reads and writes the query through this
 * rather than holding its own.
 */
export interface PaletteModeKeyContext {
    query: string;
    setQuery(value: string): void;
    /** Leave this mode and return to the command list. */
    exit(): void;
}

/** How the palette should present itself while this mode is active. */
export interface PaletteModeAppearance {
    /** Rendered in the input row, ahead of the input itself. */
    icon: React.ReactNode;
    iconColor: "accent" | "neutral-light";
    iconLabel: string;
    /** Optional marker beside the icon, e.g. a mode name pill. */
    badge?: React.ReactNode;
    placeholder: string;
    footerLabel: string;
    hints: Hint[];
    /**
     * Taller panel. A conversation grows and wants the room; a command list does not, and a list
     * stretched to full height looks broken when it holds three items.
     */
    tall: boolean;
}

/**
 * One way the palette can behave.
 *
 * A mode supplies its body, its keys and how the palette should look while it is active; the palette
 * owns the shell, the query and the input. The point of the split is that adding a mode does not
 * mean editing the palette: everything AI lives in `createAiMode`, and the palette only knows this
 * interface.
 *
 * `appearance` and `body` are read during render, so an implementation can serve them from getters
 * over observable state and let a reactive palette re-render on its own.
 */
export interface PaletteMode {
    appearance: PaletteModeAppearance;
    /** Rendered in the palette's scroll area, in place of the command list. */
    body: React.ReactNode;
    /**
     * Enter the mode, optionally carrying what the user had already typed.
     *
     * The palette calls this; the mode decides what a seed means. Returning focus to the shared
     * input is the palette's job, since the input is the palette's.
     */
    enter(seed?: string): void;
    /** Drop any state. Called when the mode is left and when the palette closes. */
    reset(): void;
    /**
     * Handle a key while this mode is active. Return true when the key was consumed, so the palette
     * leaves it alone.
     */
    handleKey(event: React.KeyboardEvent, context: PaletteModeKeyContext): boolean;
    /**
     * Called after the palette renders this mode's body, with the scroll container it was rendered
     * into. For a mode whose body grows, such as a conversation, this is where it keeps the newest
     * content in view. The element belongs to the palette; a mode only reads or scrolls it.
     */
    afterRender?(scrollContainer: HTMLElement): void;
}
