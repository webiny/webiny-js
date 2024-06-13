import React, { useEffect } from "react";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { useBind } from "@webiny/form";
import { CircularProgress } from "@webiny/ui/Progress";
import styled from "@emotion/styled";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";

type GetEntry = ReturnType<typeof useContentEntry>["getEntry"];
type UnpublishEntry = ReturnType<typeof useContentEntry>["unpublishEntryRevision"];
type UnpublishEntryParams = Parameters<UnpublishEntry>[0];
type UnpublishEntryResponse = Awaited<ReturnType<UnpublishEntry>>;

const Title = styled.span`
    font-weight: bold;
`;

interface EntryMessageProps {
    id: string;
    entryType: string;
    getEntry: GetEntry;
}

const EntryMessage = ({ id, entryType, getEntry }: EntryMessageProps) => {
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
            You are about to unpublish a {entryType} titled{" "}
            <Title>{entryBind.value.meta.title}</Title>.<br />
            Are you sure you want to continue?
        </p>
    );
};

export const ShowConfirmationOnUnpublish = useContentEntry.createDecorator(baseHook => {
    return () => {
        const { showSnackbar } = useSnackbar();
        const dialogs = useDialogs();
        const hook = baseHook();
        const { contentModel } = hook;
        const entryType = contentModel.name.toLowerCase();

        const onAccept = async (entry: CmsContentEntry) => {
            const response = await hook.unpublishEntryRevision({ id: entry.id });

            if (response.error) {
                showSnackbar(
                    `Could not unpublish ${entry.meta.title}! (${response.error.message})`
                );

                return response;
            }

            showSnackbar(`${entry.meta.title} was unpublished successfully!`);
            return response;
        };

        const showConfirmation = (params: UnpublishEntryParams) => {
            return new Promise<UnpublishEntryResponse>(resolve => {
                dialogs.showDialog({
                    title: `Unpublish ${contentModel.name}`,
                    content: (
                        <EntryMessage
                            id={params.id}
                            getEntry={hook.getEntry}
                            entryType={entryType}
                        />
                    ),
                    acceptLabel: "Yes, unpublish!",
                    cancelLabel: "Cancel",
                    loadingLabel: `Unpublishing ${entryType}...`,
                    onAccept: async ({ entry }) => resolve(await onAccept(entry)),
                    onClose: () =>
                        resolve({
                            error: { message: "Unpublishing was aborted.", code: "ABORTED" }
                        })
                });
            });
        };

        return {
            ...hook,
            unpublishEntryRevision: params => {
                return showConfirmation(params);
            }
        };
    };
});
