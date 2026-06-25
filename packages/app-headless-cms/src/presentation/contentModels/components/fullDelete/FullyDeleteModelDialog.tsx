import React, { useCallback, useMemo } from "react";
import { Dialog } from "~/admin/components/Dialog.js";
import { Dialog as AdminUiDialog } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import type { CmsModel } from "~/types.js";
import { FullyDeleteModelStateStatus } from "./types.js";
import { Content } from "./dialog/Content.js";
import { createValidationValue } from "./dialog/validationValue.js";
import { useDialogState } from "./dialog/state.js";
import { useContentModelsPresenter } from "~/presentation/contentModels/useContentModelsPresenter.js";

export interface FullyDeleteModelDialogProps {
    model: CmsModel;
    onClose: () => void;
}

export const FullyDeleteModelDialog = ({
    model: inputModel,
    onClose
}: FullyDeleteModelDialogProps) => {
    const presenter = useContentModelsPresenter();
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
            try {
                const result = await presenter.deleteModel(model!.modelId, confirmation);
                setStatusProcessed(result);
            } catch (ex: any) {
                setStatusError({
                    message: ex.message,
                    code: "FULLY_DELETE_MODEL_ERROR",
                    data: {}
                });
            }
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
