import { useMemo } from "react";
import type { z } from "zod";
import { useDrawerParamsContext } from "~/components/Drawers/DrawerParamsContext.js";

export function useDrawer<T extends z.ZodTypeAny>(
    schema: T
): { params: z.infer<T>; closeDrawer: () => void };
export function useDrawer(): { params: Record<string, unknown>; closeDrawer: () => void };
export function useDrawer(schema?: z.ZodTypeAny) {
    const { params: rawParams, closeDrawer } = useDrawerParamsContext();

    const params = useMemo(() => {
        if (schema) {
            return schema.parse(rawParams);
        }
        return rawParams;
    }, [rawParams, schema]);

    return { params, closeDrawer };
}
