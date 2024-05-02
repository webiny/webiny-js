import { useCallback } from "react";
import { useRecordLocking } from "~/hooks";
import { useContentEntry } from "@webiny/app-headless-cms";
import { useSnackbar } from "@webiny/app-admin";
import { useSave } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/Header/SaveContent/useSave";

export const UseSaveHookDecorator = useSave.createDecorator(originalHook => {
    return function useRecordLockingUseSave() {
        const values = originalHook();
        const { entry, contentModel: model } = useContentEntry();
        const { fetchLockedEntryLockRecord, updateEntryLock } = useRecordLocking();
        const { showSnackbar } = useSnackbar();

        const saveEntry = useCallback(
            async (ev: React.SyntheticEvent) => {
                if (!entry.id) {
                    return values.saveEntry(ev);
                }
                const result = await fetchLockedEntryLockRecord({
                    id: entry.id,
                    $lockingType: model.modelId
                });

                if (result?.lockedBy) {
                    const lockedBy = result.lockedBy;
                    showSnackbar(
                        `It seems that the entry is locked by ${
                            lockedBy.displayName || lockedBy.id
                        }. You cannot save the values you changed.`
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
