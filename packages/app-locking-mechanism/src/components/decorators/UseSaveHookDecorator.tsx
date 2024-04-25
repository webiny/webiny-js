import { useCallback } from "react";
import { useLockingMechanism } from "~/hooks";
import { useContentEntry } from "@webiny/app-headless-cms";
import { useSnackbar } from "@webiny/app-admin";
import { useSave } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Header/SaveContent/useSave";

export const UseSaveHookDecorator = useSave.createDecorator(originalHook => {
    return function useLockingMechanismUseSave() {
        const values = originalHook();
        const { entry, contentModel: model } = useContentEntry();
        const { fetchIsEntryLocked } = useLockingMechanism();
        const { showSnackbar } = useSnackbar();

        const saveEntry = useCallback(
            async (ev: React.SyntheticEvent) => {
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
                values.saveEntry(ev);
            },
            [values.saveEntry, entry?.id, model.modelId]
        );

        return {
            ...values,
            saveEntry
        };
    };
});
