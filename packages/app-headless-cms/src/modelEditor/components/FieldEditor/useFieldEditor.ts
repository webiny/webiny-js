import { useContext } from "react";
import { FieldEditorContext } from "./FieldEditorContext";

export function useFieldEditor() {
    const context = useContext(FieldEditorContext);
    if (!context) {
        throw new Error(`FieldEditorContext doesn't exist.`);
    }

    return context;
}
