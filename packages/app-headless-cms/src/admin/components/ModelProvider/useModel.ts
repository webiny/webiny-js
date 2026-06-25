import { useContext } from "react";
import { ModelContext } from "./ModelContext.js";
import type { CmsModel } from "~/types.js";

type UseModelReturnType = {
    model: CmsModel;
};

/**
 * Get model from the current context.
 */
export function useModel(): UseModelReturnType {
    const model = useContext(ModelContext);
    if (!model) {
        throw Error(
            `Missing "ModelContext" in the component tree. Are you using the "useModel()" hook in the right place?`
        );
    }

    return { model };
}
