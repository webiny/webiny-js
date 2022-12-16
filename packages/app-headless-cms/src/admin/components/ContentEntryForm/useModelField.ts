import { useContext } from "react";
import { FieldContext } from "./FieldContext";

export function useModelField() {
    const field = useContext(FieldContext);
    if (!field) {
        throw Error(
            `Missing "FieldContext" in the component tree. Are you using the "useContentModelField()" hook in the right place?`
        );
    }

    return { field };
}
