import { useContext } from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { ModelFieldContext, useParentValueIndex } from "./ModelFieldContext.js";
import type { CmsModelField } from "~/types.js";

export interface UseModelField {
    field: CmsModelField;
    parentValueIndex: number;
}

export const useModelField = makeDecoratable((): UseModelField => {
    const field = useContext(ModelFieldContext);

    if (!field) {
        throw Error(
            `Missing "ModelFieldProvider" in the component tree. Are you using the "useModelField()" hook in the right place?`
        );
    }

    const parentValueIndex = useParentValueIndex();

    return { field, parentValueIndex };
});
