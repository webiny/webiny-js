import { createContext, useContext } from "react";

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
}

const CommentMarkersContext = createContext<CommentMarkersContextValue>({
    contentId: null,
    container: null
});

export const CommentMarkersProvider = CommentMarkersContext.Provider;

export const useCommentMarkersContext = (): CommentMarkersContextValue => {
    return useContext(CommentMarkersContext);
};
