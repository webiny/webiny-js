import { useContext } from "react";
import { TextAlignmentActionContext } from "~/context/TextAlignmentActionContextProps";

export function useTextAlignmentAction() {
    const context = useContext(TextAlignmentActionContext);
    if (!context) {
        throw Error(
            `Missing TextAlignmentActionContext in the component hierarchy. Are you using "useTextAlignmentAction()" in the right place?`
        );
    }

    return context;
}
