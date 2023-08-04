import { useContext, useEffect } from "react";
import get from "lodash/get";
import { DynamicSourceContext } from "~/contexts/DynamicSource";

export function useDynamicValue(path?: string) {
    const context = useContext(DynamicSourceContext);

    useEffect(() => {
        if (!context || !context.refreshDynamicContainer) {
            return;
        }

        context.refreshDynamicContainer();
    }, [path]);

    if (!context) {
        return null;
    }

    return get(context.data, path || "", null) || path;
}
