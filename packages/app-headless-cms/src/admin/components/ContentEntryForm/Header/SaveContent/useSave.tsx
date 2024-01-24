import React, { useCallback } from "react";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";

interface UseSaveResponse {
    saveEntry: (ev: React.SyntheticEvent) => Promise<void>;
}

export const useSave = (): UseSaveResponse => {
    const { form, entry } = useContentEntry();

    const saveEntry = useCallback(
        async (ev: React.SyntheticEvent) => {
            await form.current.submit(ev, {
                /**
                 * We are skipping the required validator on purpose, because we want to allow partial saving of the entry.
                 */
                skipValidators: ["required"]
            });
        },
        [form, entry]
    );

    return {
        saveEntry
    };
};
