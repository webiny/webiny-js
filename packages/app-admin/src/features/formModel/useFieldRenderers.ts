import { useMemo } from "react";
import { useAdminConfig } from "../../config/AdminConfig.js";
import type { FieldRenderers } from "./FormView.js";

export const useFieldRenderers = (): FieldRenderers => {
    const { fieldRenderers } = useAdminConfig();

    return useMemo(() => {
        const map: FieldRenderers = {};
        for (const { name, component } of fieldRenderers) {
            map[name] = component;
        }
        return map;
    }, [fieldRenderers]);
};
