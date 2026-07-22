import React from "react";
import { observer } from "mobx-react-lite";
import { FormFieldWrapper } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { useCommentsPresenter } from "~/presentation/comments/useComments.js";
import { CommentFieldMarker } from "./CommentFieldMarker.js";

interface WrapperProps {
    field: IFieldVM;
    children?: React.ReactNode;
}

/**
 * Decorates the shared per-field wrapper to mount a comment marker on each field. Passes through
 * unchanged (zero layout impact) outside the CMS entry editor, where no thread contentId is set.
 */
export const FieldMarkerDecorator = FormFieldWrapper.createDecorator(Original => {
    return observer(function FieldMarkerWrapper(props: WrapperProps) {
        const presenter = useCommentsPresenter();

        if (!presenter.vm.contentId) {
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
