import { useMemo } from "react";
import { useDialogParamsContext } from "~/components/Dialogs/DialogParamsContext.js";

type OnConfirm<TData> = TData extends void ? () => Promise<void> : (data: TData) => Promise<void>;

interface UseConfirmationDialogResult<TParams, TData> {
    params: TParams;
    onConfirm: OnConfirm<TData>;
    onCancel: () => void;
    closeDialog: () => void;
}

export function useNamedConfirmationDialog<
    TParams extends Record<string, unknown> = Record<string, never>,
    TData = void
>(): UseConfirmationDialogResult<TParams, TData> {
    const { params: rawParams, closeDialog } = useDialogParamsContext();

    return useMemo(() => {
        const { onConfirm, onCancel, ...rest } = rawParams;

        return {
            params: rest as TParams,
            onConfirm: onConfirm as OnConfirm<TData>,
            onCancel: onCancel as () => void,
            closeDialog
        };
    }, [rawParams, closeDialog]);
}
