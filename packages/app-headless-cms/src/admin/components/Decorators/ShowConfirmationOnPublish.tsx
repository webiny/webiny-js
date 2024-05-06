import React, { useEffect } from "react";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { useBind } from "@webiny/form";
import { CircularProgress } from "@webiny/ui/Progress";
import styled from "@emotion/styled";
import { CmsContentEntry } from "@webiny/app-headless-cms-common/types";
import { useContentEntry } from "~/admin/views/contentEntries/hooks";

type GetEntry = ReturnType<typeof useContentEntry>["getEntry"];
type PublishEntry = ReturnType<typeof useContentEntry>["publishEntryRevision"];
type PublishEntryParams = Parameters<PublishEntry>[0];
type PublishEntryResponse = Awaited<ReturnType<PublishEntry>>;

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
            You are about to publish a {entryType} titled{" "}
            <Title>{entryBind.value.meta.title}</Title>.<br />
            Are you sure you want to continue?
        </p>
    );
};

export const ShowConfirmationOnPublish = useContentEntry.createDecorator(baseHook => {
    return () => {
        const { showSnackbar } = useSnackbar();
        const dialogs = useDialogs();
        const hook = baseHook();
        const { contentModel } = hook;
        const entryType = contentModel.name.toLowerCase();

        const onAccept = async (entry: CmsContentEntry) => {
            const response = await hook.publishEntryRevision({ id: entry.id });

            if (response.error) {
                showSnackbar(`Could not publish ${entry.meta.title}! (${response.error.message})`);

                return response;
            }

            showSnackbar(`${entry.meta.title} was published successfully!`);
            return response;
        };

        const showConfirmation = (params: PublishEntryParams) => {
            return new Promise<PublishEntryResponse>(resolve => {
                dialogs.showDialog({
                    title: `Publish ${contentModel.name}`,
                    content: (
                        <EntryMessage
                            id={params.id}
                            getEntry={hook.getEntry}
                            entryType={entryType}
                        />
                    ),
                    acceptLabel: "Yes, publish!",
                    cancelLabel: "Cancel",
                    loadingLabel: `Publishing ${entryType}...`,
                    onAccept: async ({ entry }) => resolve(await onAccept(entry)),
                    onClose: () =>
                        resolve({ error: { message: "Publishing was aborted.", code: "ABORTED" } })
                });
            });
        };

        return {
            ...hook,
            publishEntryRevision: params => {
                return showConfirmation(params);
            }
        };
    };
});
