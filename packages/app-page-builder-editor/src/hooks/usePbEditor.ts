import { useContext } from "react";
import { EditorContext } from "~/contexts/Editor";

export function usePbEditor() {
    return useContext(EditorContext);
}
