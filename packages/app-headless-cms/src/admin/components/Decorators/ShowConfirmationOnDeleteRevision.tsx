import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { useBind } from "@webiny/form";
import { useDialogs } from "@webiny/app-admin";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";
import { CircularProgress } from "@webiny/ui/Progress";

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

        const showConfirmation = (params: DeleteEntryParams) => {
            return new Promise<DeleteEntryResponse>(resolve => {
                dialogs.showDialog({
                    title: "Delete revision",
                    content: <EntryMessage id={params.id} getEntryRevision={hook.getEntry} />,
                    acceptLabel: "Confirm",
                    cancelLabel: "Cancel",
                    loadingLabel: "Deleting revision...",
                    onAccept: async () => resolve(await hook.deleteEntryRevision(params)),
                    onClose: () => resolve({ error: { message: "Action aborted.", code: 'ACTION_ABORTED' } })
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
