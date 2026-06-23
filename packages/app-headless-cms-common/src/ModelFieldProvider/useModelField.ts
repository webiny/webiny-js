import { useContext } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { ModelFieldContext } from "./ModelFieldContext.js";
import type { CmsModelField } from "~/types/index.js";

export interface UseModelField {
    field: CmsModelField;
}

/**
 * Get model field from the current context.
 */
export const useModelField = makeDecoratable((): UseModelField => {
    const field = useContext(ModelFieldContext);

    if (!field) {
        throw Error(
            `Missing "ModelFieldProvider" in the component tree. Are you using the "useModelField()" hook in the right place?`
        );
    }

    return { field };
});
