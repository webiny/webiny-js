import { useContext } from "react";
import { FieldEditorContext } from "./FieldEditorContext";

export function useFieldEditor() {
    return useContext(FieldEditorContext);
}
