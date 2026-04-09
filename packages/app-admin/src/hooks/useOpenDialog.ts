import { useCallback } from "react";
import type { z } from "zod";
import { useDialogs } from "~/components/Dialogs/useDialogs.js";

export function useOpenDialog<T extends z.ZodTypeAny>(
    schema: T
): { openDialog: (name: string, params: z.infer<T>) => void };
export function useOpenDialog(): {
    openDialog: (name: string, params: Record<string, unknown>) => void;
};
export function useOpenDialog(schema?: z.ZodTypeAny) {
    const { openNamedDialog } = useDialogs();

    const openDialog = useCallback(
        (name: string, params: Record<string, unknown>) => {
            if (schema) {
                schema.parse(params);
            }
            openNamedDialog(name, params);
        },
        [openNamedDialog, schema]
    );

    return { openDialog };
}
