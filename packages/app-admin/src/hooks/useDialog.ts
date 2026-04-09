import { useMemo } from "react";
import type { z } from "zod";
import { useDialogParamsContext } from "~/components/Dialogs/DialogParamsContext.js";

export function useDialog<T extends z.ZodTypeAny>(
    schema: T
): { params: z.infer<T>; closeDialog: () => void };
export function useDialog(): { params: Record<string, unknown>; closeDialog: () => void };
export function useDialog(schema?: z.ZodTypeAny) {
    const { params: rawParams, closeDialog } = useDialogParamsContext();

    const params = useMemo(() => {
        if (schema) {
            return schema.parse(rawParams);
        }
        return rawParams;
    }, [rawParams, schema]);

    return { params, closeDialog };
}
