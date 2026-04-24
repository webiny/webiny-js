import { useMemo } from "react";
import { useAdminConfig } from "../../config/AdminConfig.js";
import type { LayoutRenderers } from "./FormView.js";

export const useLayoutRenderers = (): LayoutRenderers => {
    const { layoutRenderers } = useAdminConfig();

    return useMemo(() => {
        const map: LayoutRenderers = {};
        for (const { name, component } of layoutRenderers) {
            map[name] = component;
        }
        return map;
    }, [layoutRenderers]);
};
