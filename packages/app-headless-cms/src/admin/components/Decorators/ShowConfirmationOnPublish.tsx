import React, { useCallback, useEffect, useState } from "react";
import { useDialogs, useSnackbar } from "@webiny/app-admin";
import { useBind } from "@webiny/form";
import { Textarea, Text } from "@webiny/admin-ui";
import { CircularProgress } from "@webiny/ui/Progress/index.js";
import styled from "@emotion/styled";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";

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

    const [description, setDescription] = useState("");

    const onRevisionDescriptionChange = useCallback(
        (value: string) => {
            setDescription(value);
            entryBind.onChange({
                ...entryBind.value,
                revisionDescription: value
            });
        },
        [entryBind.value]
    );

    useEffect(() => {
        getEntry({ id }).then(response => {
            entryBind.onChange(response.entry);
        });
    }, []);

    if (!entryBind.value) {
        return <CircularProgress label={"Checking entry..."} />;
    }

    return (
        <>
            <p>
                You are about to publish a {entryType} titled{" "}
                <Title>{entryBind.value.meta.title}</Title>.<br />
                Are you sure you want to continue?
            </p>
            <Text as={"div"} size={"sm"} className={"mt-2"}>
                Write a revision description (optional):
            </Text>
            <Textarea onChange={onRevisionDescriptionChange} value={description} />
        </>
    );
};

export const ShowConfirmationOnPublish = useContentEntry.createDecorator(baseHook => {
    return () => {
        const { showSnackbar, showErrorSnackbar } = useSnackbar();
        const dialogs = useDialogs();
        const hook = baseHook();
        const { contentModel } = hook;
        const entryType = contentModel.name.toLowerCase();

        const onAccept = async (
            entry: Pick<CmsContentEntry, "id" | "revisionDescription" | "meta">
        ) => {
            const updateEntryDescriptionResponse = await hook.updateRevisionDescription({
                id: entry.id,
                revisionDescription: entry.revisionDescription || ""
            });
            if (updateEntryDescriptionResponse.error) {
                showErrorSnackbar(
                    `Could not update revision description for ${entry.meta.title}! (${updateEntryDescriptionResponse.error.message})`
                );

                return updateEntryDescriptionResponse;
            }

            const response = await hook.publishEntryRevision({
                id: entry.id
            });

            if (response.error) {
                showErrorSnackbar(
                    `Could not publish ${entry.meta.title}! (${response.error.message})`
                );

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
                    onAccept: async ({ entry }) => {
                        resolve(await onAccept(entry));
                    },
                    onClose: () => {
                        resolve({ error: { message: "Publishing was aborted.", code: "ABORTED" } });
                    }
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
