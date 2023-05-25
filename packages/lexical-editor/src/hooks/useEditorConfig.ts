import { useContext } from "react";
import {EditorConfigContext} from "~/context/EditorConfigContext";

export function useEditorConfig() {
    const context = useContext(EditorConfigContext);
    if (!context) {
        throw Error(
            `Missing EditorConfigContext in the component hierarchy. Are you using "useEditorConfig()" in the right place?`
        );
    }

    return context;
}
