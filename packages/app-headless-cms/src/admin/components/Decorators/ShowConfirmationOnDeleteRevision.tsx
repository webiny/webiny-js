import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { useBind } from "@webiny/form";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";
import { CircularProgress } from "@webiny/ui/Progress";
import { EntryRevisionDeletedSnackbarMessage } from "./EntryRevisionDeletedSnackbarMessage";

type GetEntry = ReturnType<typeof useContentEntry>["getEntry"];
type DeleteEntry = ReturnType<typeof useContentEntry>["deleteEntry"];
type DeleteEntryParams = Parameters<DeleteEntry>[0];
type DeleteEntryResponse = Awaited<ReturnType<DeleteEntry>>;

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

        const onAccept = async (params: DeleteEntryParams) => {
            const revisionToDelete = hook.revisions.find(rev => rev.id === params.id)!;

            const response = await hook.deleteEntryRevision(revisionToDelete);
            if (typeof response === "object" && response.error) {
                const { error } = response;
                showSnackbar(error.message);
                return response;
            }

            // The `revisions.data` array contains all revisions of the entry, ordered from
            // the latest to the oldest. The first element in the array is the latest revision.
            // What we're doing here is finding the latest revision that is not the current one.
            const newLatestRevision = hook.revisions.find(
                revision => revision.id !== revisionToDelete.id
            );

            showSnackbar(
                <EntryRevisionDeletedSnackbarMessage
                    deletedRevision={revisionToDelete}
                    newLatestRevision={newLatestRevision}
                />
            );

            return response;
        };
        const showConfirmation = (params: DeleteEntryParams) => {
            return new Promise<DeleteEntryResponse>(resolve => {
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
