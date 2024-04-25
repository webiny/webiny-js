import { useCallback } from "react";
import {
    ShowConfirmationDialogParams,
    useSaveAndPublish
} from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Header/SaveAndPublishContent/useSaveAndPublish";
import { useLockingMechanism } from "~/hooks";
import { useContentEntry } from "@webiny/app-headless-cms";
import { useSnackbar } from "@webiny/app-admin";

export const UseSaveAndPublishHookDecorator = useSaveAndPublish.createDecorator(originalHook => {
    return function useLockingMechanismUseSaveAndPublish() {
        const values = originalHook();
        const { entry, contentModel: model } = useContentEntry();
        const { fetchIsEntryLocked, updateEntryLock } = useLockingMechanism();
        const { showSnackbar } = useSnackbar();

        const showConfirmationDialog = useCallback(
            (params: ShowConfirmationDialogParams) => {
                (async () => {
                    if (!entry.id) {
                        return values.showConfirmationDialog(params);
                    }
                    const result = await fetchIsEntryLocked({
                        id: entry.id,
                        $lockingType: model.modelId
                    });

                    if (result) {
                        showSnackbar(
                            "It seems that the entry is locked by someone. You cannot save the values you changed."
                        );
                        return;
                    }
                    values.showConfirmationDialog(params);
                    updateEntryLock({
                        id: entry.id,
                        $lockingType: model.modelId
                    });
                })();
            },
            [values.showConfirmationDialog, entry?.id, model.modelId]
        );

        return {
            ...values,
            showConfirmationDialog
        };
    };
});
