import { useCallback } from "react";
import { useRecordLocking } from "~/hooks";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { useSnackbar } from "@webiny/app-admin";

const {
    ContentEntry: { ContentEntryForm, useContentEntry }
} = ContentEntryEditorConfig;

type SaveEntry = ReturnType<typeof ContentEntryForm.useContentEntryForm>["saveEntry"];

export const UseSaveEntryDecorator = ContentEntryForm.useContentEntryForm.createDecorator(
    originalHook => {
        return function useRecordLockingUseSave() {
            const hook = originalHook();
            const { entry, contentModel: model } = useContentEntry();
            const { fetchLockedEntryLockRecord, updateEntryLock } = useRecordLocking();
            const { showSnackbar } = useSnackbar();

            const saveEntry: SaveEntry = useCallback(
                async (...params) => {
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

                    const saveResult = await hook.saveEntry(...params);
                    if (saveResult) {
                        await updateEntryLock({
                            id: saveResult.id,
                            $lockingType: model.modelId
                        });
                    }

                    return saveResult;
                },
                [entry?.id, model.modelId, updateEntryLock]
            );

            return {
                ...hook,
                saveEntry
            };
        };
    }
);
