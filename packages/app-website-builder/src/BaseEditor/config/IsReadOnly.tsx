import React from "react";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";

export interface IsNotReadOnlyProps {
    children: React.ReactNode;
}

export const IsReadOnly = ({ children }: IsNotReadOnlyProps) => {
    const isEditorReadOnly = useSelectFromEditor(state => state.isReadOnly);

    if (isEditorReadOnly) {
        return <>{children}</>;
    }
    return null;
};
