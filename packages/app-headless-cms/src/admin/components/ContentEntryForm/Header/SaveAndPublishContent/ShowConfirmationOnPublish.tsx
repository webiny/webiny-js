import React from "react";
import { useConfirmationDialog } from "@webiny/app-admin";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";

export const ShowConfirmationOnPublish = useContentEntry.createDecorator(baseHook => {
    return () => {
        const hook = baseHook();

        const { showConfirmation } = useConfirmationDialog({
            title: "Publish content",
            message: (
                <p>You are about to publish a new revision. Are you sure you want to continue?</p>
            ),
            dataTestId: "cms-confirm-save-and-publish"
        });

        return {
            ...hook,
            publishEntryRevision: (...params) => {
                return new Promise(resolve => {
                    showConfirmation(
                        () => resolve(hook.publishEntryRevision(...params)),
                        () => resolve({ error: { message: "Cancelled" } })
                    );
                });
            }
        };
    };
});
