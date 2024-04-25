import { useCallback } from "react";
import { useLockingMechanism } from "~/hooks";
import { useContentEntry } from "@webiny/app-headless-cms";
import { useSnackbar } from "@webiny/app-admin";
import { useSave } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Header/SaveContent/useSave";

export const UseSaveHookDecorator = useSave.createDecorator(originalHook => {
    return function useLockingMechanismUseSave() {
        const values = originalHook();
        const { entry, contentModel: model } = useContentEntry();
        const { fetchIsEntryLocked, updateEntryLock } = useLockingMechanism();
        const { showSnackbar } = useSnackbar();

        const saveEntry = useCallback(
            async (ev: React.SyntheticEvent) => {
                if (!entry.id) {
                    return values.saveEntry(ev);
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
                await values.saveEntry(ev);
                await updateEntryLock({
                    id: entry.id,
                    $lockingType: model.modelId
                });
            },
            [values.saveEntry, entry?.id, model.modelId, updateEntryLock]
        );

        return {
            ...values,
            saveEntry
        };
    };
});
