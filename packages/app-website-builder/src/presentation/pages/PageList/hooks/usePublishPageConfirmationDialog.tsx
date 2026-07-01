import React, { useCallback, useRef, useState } from "react";
import { Text, Textarea } from "@webiny/admin-ui";
import { usePublishPage, useUpdatePageRevisionDescription } from "~/features/pages/index.js";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import type { PageDto } from "~/domain/Page/index.js";

interface IDialogContentMessageProps {
    title: string;
    onDescriptionChange: (value: string) => void;
}

const DialogContentMessage = (props: IDialogContentMessageProps) => {
    const { onDescriptionChange, title } = props;
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
            <Text>
                You are about to publish <strong>{title}</strong>. Are you sure you want to
                continue?
            </Text>
            <Text size={"sm"} className={"mt-2"}>
                Write a revision description (optional):
            </Text>
            <Textarea value={revisionDescription} onChange={onChange} />
        </>
    );
};

interface UsePublishPageConfirmationDialogProps {
    page: PageDto;
}

export const usePublishPageConfirmationDialog = ({
    page
}: UsePublishPageConfirmationDialogProps) => {
    const { publishPage } = usePublishPage();
    const { showSnackbar } = useSnackbar();
    const revisionDescriptionRef = useRef("");
    const { updatePageRevisionDescription } = useUpdatePageRevisionDescription();

    const onDescriptionChange = useCallback((value: string) => {
        revisionDescriptionRef.current = value;
    }, []);

    const { showConfirmation } = useConfirmationDialog({
        title: "Publish page",
        message: (
            <DialogContentMessage
                title={page.properties.title}
                onDescriptionChange={onDescriptionChange}
            />
        )
    });

    const openPublishPageConfirmationDialog = useCallback(
        () =>
            showConfirmation(async () => {
                try {
                    await updatePageRevisionDescription({
                        id: page.id,
                        revisionDescription: revisionDescriptionRef.current
                    });
                    await publishPage({ id: page.id });
                    showSnackbar(`${page.properties.title} was published successfully!`);
                } catch (ex) {
                    showSnackbar(ex.message || `Error while publishing ${page.properties.title}`);
                }
            }),
        [page]
    );

    return { openPublishPageConfirmationDialog };
};
