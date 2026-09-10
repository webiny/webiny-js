import { useCallback } from "react";
import type { z } from "zod";
import { useDrawers } from "~/components/Drawers/useDrawers.js";

export function useOpenDrawer<T extends z.ZodTypeAny>(
    schema: T
): { openDrawer: (name: string, params: z.infer<T>) => void };
export function useOpenDrawer(): {
    openDrawer: (name: string, params?: Record<string, unknown>) => void;
};
export function useOpenDrawer(schema?: z.ZodTypeAny) {
    const { openNamedDrawer } = useDrawers();

    const openDrawer = useCallback(
        (name: string, params: Record<string, unknown> = {}) => {
            if (schema) {
                schema.parse(params);
            }
            openNamedDrawer(name, params);
        },
        [openNamedDrawer, schema]
    );

    return { openDrawer };
}
