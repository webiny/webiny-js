import { useContext } from "react";
import { FontColorActionContext } from "~/context/FontColorActionContext";

export function useFontColorPicker() {
    const context = useContext(FontColorActionContext);
    if (!context) {
        throw Error(
            `Missing FontColorActionContext in the component hierarchy. Are you using "useFontColorPicker()" in the right place?`
        );
    }

    return context;
}
