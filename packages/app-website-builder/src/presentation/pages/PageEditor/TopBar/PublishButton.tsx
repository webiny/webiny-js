import React, { useCallback, useRef, useState } from "react";
import { Button, Text, Textarea, useToast } from "@webiny/admin-ui";
import { useDialogs, useRouter } from "@webiny/app-admin";
import { ReactComponent as PublishIcon } from "@webiny/icons/publish.svg";
import { usePublishPage, useUpdatePageRevisionDescription } from "~/features/pages/index.js";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import type { EditorPage } from "@webiny/website-builder-sdk";
import { Routes } from "~/routes.js";

interface IDialogContentMessageProps {
    onDescriptionChange: (value: string) => void;
}

const DialogContentMessage = (props: IDialogContentMessageProps) => {
    const { onDescriptionChange } = props;
    const [revisionDescription, setRevisionDescription] = useState("");

    const onChange = useCallback(
        (value: string) => {
            setRevisionDescription(value);
            onDescriptionChange(value);
        },
        [onDescriptionChange]
    );

    return (
        <>
            <Text>You are about to publish this page. Are you sure you want to continue?</Text>
            <Text size={"sm"} className={"mt-2"}>
                Write a revision description (optional):
            </Text>
            <Textarea value={revisionDescription} onChange={onChange} />
        </>
    );
};

export const PublishButton = () => {
    const { goToRoute } = useRouter();
    const { showSuccessToast } = useToast();
    const { updatePageRevisionDescription } = useUpdatePageRevisionDescription();
    const { publishPage } = usePublishPage();
    const { showDialog } = useDialogs();
    const revisionDescriptionRef = useRef("");

    const folderId = useSelectFromDocument<string, EditorPage>(
        document => document.location.folderId
    );
    const id = useSelectFromDocument(document => document.id);

    const onDescriptionChange = useCallback((value: string) => {
        revisionDescriptionRef.current = value;
    }, []);

    const onAccept = useCallback(async () => {
        await updatePageRevisionDescription({
            id,
            revisionDescription: revisionDescriptionRef.current
        });
        await publishPage({ id });

        showSuccessToast({
            title: "Page was published successfully!"
        });

        goToRoute(Routes.Pages.List, { folderId });
    }, [id, folderId, publishPage, updatePageRevisionDescription]);

    const publish = () => {
        showDialog({
            title: "Publish page",
            icon: <PublishIcon />,
            content: <DialogContentMessage onDescriptionChange={onDescriptionChange} />,
            acceptLabel: "Yes, publish this page!",
            cancelLabel: "Cancel",
            onAccept
        });
    };

    return (
        <Button
            variant="primary"
            text={"Publish"}
            onClick={publish}
            icon={<PublishIcon />}
        ></Button>
    );
};
