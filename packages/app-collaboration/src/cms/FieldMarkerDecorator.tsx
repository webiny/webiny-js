import React from "react";
import { observer } from "mobx-react-lite";
import { useContainer } from "@webiny/app";
import { FormFieldWrapper } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { useCommentMarkersContext } from "./CommentMarkersContext.js";
import { CommentFieldMarker } from "./CommentFieldMarker.js";

interface WrapperProps {
    field: IFieldVM;
    children?: React.ReactNode;
}

/**
 * Decorates the shared per-field wrapper to mount a comment marker on each field. Renders the
 * marker only for fields belonging to the entry form comments are active for: the context carries
 * that form's DI container, and a field rendered in a different container (e.g. the child
 * container of a referenced-entry create/edit drawer) is left untouched. Passes through unchanged
 * on every other form (no context provider) with zero layout impact.
 */
export const FieldMarkerDecorator = FormFieldWrapper.createDecorator(Original => {
    return observer(function FieldMarkerWrapper(props: WrapperProps) {
        const { contentId, container } = useCommentMarkersContext();
        const currentContainer = useContainer();

        // Active only inside the entry form that owns the comments panel — not in a nested
        // referenced-entry drawer (rendered in a child container) or any unrelated form.
        const active = !!contentId && container === currentContainer;

        if (!active) {
            return <Original {...props} />;
        }

        return (
            <div className="wby-collab-field" style={{ position: "relative" }}>
                <Original {...props} />
                <CommentFieldMarker field={props.field} />
            </div>
        );
    });
});
