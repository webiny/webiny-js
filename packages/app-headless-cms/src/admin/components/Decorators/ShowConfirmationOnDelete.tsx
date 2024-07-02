import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { useBind } from "@webiny/form";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";
import { CircularProgress } from "@webiny/ui/Progress";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";

type GetEntry = ReturnType<typeof useContentEntry>["getEntry"];
type DeleteEntry = ReturnType<typeof useContentEntry>["deleteEntry"];
type DeleteEntryParams = Parameters<DeleteEntry>[0];
type DeleteEntryResponse = Awaited<ReturnType<DeleteEntry>>;

const Title = styled.span`
    font-weight: bold;
`;

const EntryMessage = ({ id, getEntry }: { id: string; getEntry: GetEntry }) => {
    const entryBind = useBind({
        name: "entry"
    });

    useEffect(() => {
        getEntry({ id }).then(response => {
            entryBind.onChange(response.entry);
        });
    }, []);

    if (!entryBind.value) {
        return <CircularProgress label={"Checking entry..."} />;
    }

    return (
        <p>
            Are you sure you want to move <Title>{entryBind.value.meta.title}</Title> to trash?
            <br />
            This action will include all of the revisions.
        </p>
    );
};

export const ShowConfirmationOnDelete = useContentEntry.createDecorator(baseHook => {
    return () => {
        const hook = baseHook();
        const dialogs = useDialogs();
        const { showSnackbar } = useSnackbar();

        const onAccept = async (entry: CmsContentEntry) => {
            const response = await hook.deleteEntry({ id: entry.entryId });

            if (typeof response !== "boolean") {
                showSnackbar(
                    `Could not move ${entry.meta.title} to trash! (${response.error.message})`
                );

                return response;
            }

            showSnackbar(`${entry.meta.title} has been moved to trash successfully!`);
            return response;
        };

        const showConfirmation = (params: DeleteEntryParams) => {
            return new Promise<DeleteEntryResponse>(resolve => {
                dialogs.showDialog({
                    title: "Trash entry",
                    content: <EntryMessage id={params.id} getEntry={hook.getEntry} />,
                    acceptLabel: "Confirm",
                    cancelLabel: "Cancel",
                    loadingLabel: "Moving entry to trash...",
                    onAccept: async ({ entry }) => resolve(await onAccept(entry)),
                    onClose: () => resolve({ error: { message: "Cancelled" } })
                });
            });
        };

        return {
            ...hook,
            deleteEntry: params => {
                return showConfirmation(params);
            }
        };
    };
});
