import type React from "react";

/** A panel on the right of the editor, as the editor config holds it. */
export interface PanelConfig {
    name: string;
    /** Written down the rail. Short: one or two words. */
    label: string;
    icon?: React.JSX.Element;
    /** The panel itself. It sizes itself and sets `data-affects-preview="width"`. */
    element: React.JSX.Element;
    /** Whether the panel is open the first time the editor is used. */
    defaultOpen: boolean;
    /** Whether the panel's tab shows in a read-only editor. */
    showInReadOnly: boolean;
}
