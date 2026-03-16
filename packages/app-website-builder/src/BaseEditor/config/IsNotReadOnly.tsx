import React from "react";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";

export interface IsNotReadOnlyProps {
    children: React.ReactNode;
}

export const IsNotReadOnly = ({ children }: IsNotReadOnlyProps) => {
    const isEditorReadOnly = useSelectFromEditor(state => state.isReadOnly);

    if (isEditorReadOnly) {
        return null;
    }

    return <>{children}</>;
};
