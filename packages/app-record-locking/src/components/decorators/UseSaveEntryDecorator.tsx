import { useCallback } from "react";
import { useRecordLocking } from "~/hooks";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useSnackbar } from "@webiny/app-admin";

const {
    ContentEntry: { ContentEntryForm, useContentEntry }
} = ContentEntryEditorConfig;

export const UseSaveEntryDecorator = ContentEntryForm.useContentEntryForm.createDecorator(
    originalHook => {
        return function useRecordLockingUseSave() {
            const hook = originalHook();
            const { entry, contentModel: model } = useContentEntry();
            const { fetchLockedEntryLockRecord, updateEntryLock } = useRecordLocking();
            const { showSnackbar } = useSnackbar();

            const saveEntry = useCallback(async () => {
                if (!entry.id) {
                    return hook.saveEntry();
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
                        }. You can't save your changes.`
                    );
                    return null;
                }

                const saveResult = await hook.saveEntry();
                if (saveResult) {
                    await updateEntryLock({
                        id: saveResult.id,
                        $lockingType: model.modelId
                    });
                }

                return saveResult;
            }, [entry?.id, model.modelId, updateEntryLock]);

            return {
                ...hook,
                saveEntry
            };
        };
    }
);
