import { createContext, useContext } from "react";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { ItemLocator } from "~/cms/listItemLocators.js";

/**
 * Scopes the per-field comment markers to the entry form they belong to.
 *
 * The markers decorate the shared, app-wide FormFieldWrapper, so without scoping they would also
 * render on unrelated forms (access management, file settings, …) and — the case this guards —
 * on the nested entry form shown when creating/editing a *referenced* entry in a drawer. That
 * drawer renders its form in a child DI container, so we tag the context with the container the
 * markers are active in and compare against the container each field actually renders in: a
 * mismatch (drawer/child container) means "not this form", so no marker.
 */
export interface CommentMarkersContextValue {
    /** contentId of the entry comments are active for, or null when markers are disabled. */
    contentId: string | null;
    /** DI container the main entry form renders in. Typed loosely to avoid a @webiny/di dep. */
    container: unknown;
    /**
     * Per-item locators for fields nested inside array/list fields, keyed by the exact rendered
     * `IFieldVM`. A hit means the field lives inside a list item and its marker must anchor on the
     * id-based `locator` (unique per element) instead of the shared `qualifiedName`.
     */
    itemLocators: Map<IFieldVM, ItemLocator>;
}

const CommentMarkersContext = createContext<CommentMarkersContextValue>({
    contentId: null,
    container: null,
    itemLocators: new Map()
});

export const CommentMarkersProvider = CommentMarkersContext.Provider;

export const useCommentMarkersContext = (): CommentMarkersContextValue => {
    return useContext(CommentMarkersContext);
};
