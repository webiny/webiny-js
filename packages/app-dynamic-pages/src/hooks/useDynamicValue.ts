import { useContext, useEffect } from "react";
import get from "lodash/get";
import { useResolvedPath } from "~/hooks/useResolvedPath";
import { DynamicSourceContext } from "~/contexts/DynamicSource";

export function useDynamicValue(path?: string) {
    const context = useContext(DynamicSourceContext);
    const { data: resolvedPath } = useResolvedPath(context?.modelId || "", path || "");

    useEffect(() => {
        if (!context || !context.refreshDynamicContainer) {
            return;
        }

        context.refreshDynamicContainer();
    }, [path]);

    if (!context) {
        return null;
    }

    return get(context.data, resolvedPath || "", null) || path;
}
