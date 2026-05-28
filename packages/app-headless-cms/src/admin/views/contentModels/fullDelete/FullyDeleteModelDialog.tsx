import React, { useCallback, useMemo } from "react";
import { Dialog } from "~/admin/components/Dialog.js";
import { Dialog as AdminUiDialog } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import type { CmsModel } from "~/types.js";
import { FullyDeleteModelStateStatus } from "./types.js";
import { Content } from "./dialog/Content.js";
import { createValidationValue } from "./dialog/validationValue.js";
import { createProcessConfirmation } from "./dialog/process.js";
import { useApolloClient } from "~/admin/hooks/index.js";
import { useDialogState } from "./dialog/state.js";
import { updateModelInCache } from "~/admin/views/contentModels/cache.js";

export interface FullyDeleteModelDialogProps {
    model: CmsModel;
    onClose: () => void;
}

/**
 * It's not a mistake to use cancel to accept and accept to cancel. It is just a matter of styling.
 * We want the accept button to be less visible.
 */
export const FullyDeleteModelDialog = ({
    model: inputModel,
    onClose
}: FullyDeleteModelDialogProps) => {
    const client = useApolloClient();

    const state = useDialogState(inputModel);

    const {
        model,
        status,
        confirmation,
        setConfirmation,
        setStatusUnderstood,
        setStatusProcessed,
        setStatusConfirmed,
        setStatusError,
        setError
    } = state;

    const processConfirmation = useMemo(() => {
        return createProcessConfirmation({
            client
        });
    }, [client]);

    const startProcessing = useCallback(() => {
        const value = createValidationValue(model!);
        if (confirmation !== value) {
            setError({
                message: "Confirmation value is not correct.",
                code: "CONFIRMATION_ERROR"
            });
            return;
        }
        setStatusConfirmed();

        (async () => {
            const result = await processConfirmation({
                model: model!,
                confirmation,
                onSuccess: cache => {
                    updateModelInCache(cache, {
                        ...model!,
                        isBeingDeleted: true
                    });
                }
            });
            if (result.error) {
                setStatusError(result.error);
                return;
            }

            setStatusProcessed(result.data);
        })();
    }, [state]);

    const title = useMemo(() => {
        if (model.plugin) {
            return "Delete all entries of the model?";
        }
        return "Delete content model and all its entries?";
    }, [model.modelId]);

    const primaryButtonText = useMemo(() => {
        if (status === FullyDeleteModelStateStatus.UNDERSTOOD) {
            return "Yes, delete the model";
        }
        return "Yes, I understand";
    }, [status]);

    const onYesClick = useMemo(() => {
        if (status === FullyDeleteModelStateStatus.NONE) {
            return setStatusUnderstood;
        }
        return startProcessing;
    }, [setStatusUnderstood, startProcessing, status]);

    return (
        <Dialog
            open={!!model}
            onClose={onClose}
            dismissible={false}
            data-testid="cms-delete-content-model-dialog"
            title={title}
            actions={
                <>
                    <AdminUiDialog.CancelAction
                        data-testid="cms-delete-content-model-close-button"
                        text={
                            status === FullyDeleteModelStateStatus.PROCESSED ||
                            status === FullyDeleteModelStateStatus.ERROR
                                ? "OK"
                                : "Cancel"
                        }
                    />
                    {(status === FullyDeleteModelStateStatus.NONE ||
                        status === FullyDeleteModelStateStatus.UNDERSTOOD) && (
                        <Button
                            variant={"primary"}
                            data-testid="cms-delete-content-model-confirm-button"
                            onClick={onYesClick}
                        >
                            {primaryButtonText}
                        </Button>
                    )}
                </>
            }
        >
            <Content
                model={model}
                setConfirmation={setConfirmation}
                confirmation={confirmation}
                error={state.error}
                status={status}
            />
        </Dialog>
    );
};
