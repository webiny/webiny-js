import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { useBind } from "@webiny/form";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";
import { CircularProgress } from "@webiny/ui/Progress";
import { EntryRevisionDeletedSnackbarMessage } from "./ShowConfirmationOnDeleteRevision/EntryRevisionDeletedSnackbarMessage";
import {
    DeleteEntryRevisionParams,
    DeleteEntryRevisionResponse
} from "~/admin/views/contentEntries/ContentEntry/ContentEntryContext";

type GetEntry = ReturnType<typeof useContentEntry>["getEntry"];

const Title = styled.span`
    font-weight: bold;
`;

const EntryMessage = ({ id, getEntryRevision }: { id: string; getEntryRevision: GetEntry }) => {
    const entryRevisionBind = useBind({
        name: "entryRevision"
    });

    useEffect(() => {
        getEntryRevision({ id }).then(response => {
            entryRevisionBind.onChange(response.entry);
        });
    }, []);

    if (!entryRevisionBind.value) {
        return <CircularProgress label={"Checking revision..."} />;
    }

    return (
        <p>
            Are you sure you want to permanently delete revision&nbsp;
            <Title>#{entryRevisionBind.value.meta.version}</Title> of the&nbsp;
            <Title>{entryRevisionBind.value.meta.title}</Title> entry?
        </p>
    );
};

export const ShowConfirmationOnDeleteRevision = useContentEntry.createDecorator(baseHook => {
    return () => {
        const hook = baseHook();
        const dialogs = useDialogs();
        const { showSnackbar } = useSnackbar();

        const onAccept = async (params: DeleteEntryRevisionParams) => {
            const revisionToDelete = hook.revisions.find(rev => rev.id === params.id)!;

            const response = await hook.deleteEntryRevision(revisionToDelete);
            if (typeof response === "object" && response.error) {
                const { error } = response;
                showSnackbar(error.message);
                return response;
            }

            showSnackbar(
                <EntryRevisionDeletedSnackbarMessage
                    deletedRevision={revisionToDelete}
                    newLatestRevision={response.newLatestRevision}
                />
            );

            return response;
        };
        const showConfirmation = (params: DeleteEntryRevisionParams) => {
            return new Promise<DeleteEntryRevisionResponse>(resolve => {
                dialogs.showDialog({
                    title: "Delete revision",
                    content: <EntryMessage id={params.id} getEntryRevision={hook.getEntry} />,
                    acceptLabel: "Confirm",
                    cancelLabel: "Cancel",
                    loadingLabel: "Deleting revision...",
                    onAccept: async () => resolve(await onAccept(params)),
                    onClose: () => resolve({ error: { message: "Cancelled" } })
                });
            });
        };

        return {
            ...hook,
            deleteEntryRevision: params => {
                return showConfirmation(params);
            }
        };
    };
});
