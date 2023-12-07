import React, { ReactNode } from "react";

import { i18n } from "@webiny/app/i18n";
import { Bind, GenericFormData } from "@webiny/form";
import { Typography } from "@webiny/ui/Typography";
import { useDialogs } from "~/dialogs/useDialogs";
import { FolderTree } from "~/components";
import { DialogFoldersContainer } from "~/dialogs/styled";

const t = i18n.ns("app-aco/dialogs/use-move-to-folder-dialog");

interface ShowDialogParams {
    title?: ReactNode;
    message?: ReactNode;
    acceptLabel?: ReactNode;
    cancelLabel?: ReactNode;
    loadingLabel?: ReactNode;
    focusedFolderId: string;
    onAccept: (data: GenericFormData) => void;
    onClose?: () => void;
}

interface UseMoveToFolderDialogResponse {
    showDialog: (params: ShowDialogParams) => void;
}

interface MessageProps {
    helpText: ReactNode;
    focusedFolderId: string;
}

export const Message = ({ helpText, focusedFolderId }: MessageProps) => {
    return (
        <>
            <Typography use="body1">{helpText}</Typography>
            <DialogFoldersContainer>
                <Bind name={"folder"} defaultValue={{ id: focusedFolderId }}>
                    {({ value, onChange }) => (
                        <FolderTree
                            focusedFolderId={value.id}
                            onFolderClick={onChange}
                            enableCreate={true}
                        />
                    )}
                </Bind>
            </DialogFoldersContainer>
        </>
    );
};

export const useMoveToFolderDialog = (): UseMoveToFolderDialogResponse => {
    const dialogs = useDialogs();

    const showDialog = ({
        title = t`Move item`,
        message = t`Are you sure you want to continue?`,
        acceptLabel = t`Move item`,
        cancelLabel = t`Cancel`,
        loadingLabel = t`Moving item`,
        onAccept,
        onClose,
        focusedFolderId
    }: ShowDialogParams) => {
        dialogs.showDialog({
            title,
            message: <Message helpText={message} focusedFolderId={focusedFolderId} />,
            acceptLabel,
            cancelLabel,
            loadingLabel,
            onAccept: (data: GenericFormData) => onAccept(data),
            onClose
        });
    };

    return {
        showDialog
    };
};
