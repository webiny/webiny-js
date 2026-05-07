import type { ReactNode } from "react";
import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import type { GenericFormData } from "@webiny/form";
import { Bind } from "@webiny/form";
import { useDialogs } from "@webiny/app-admin";
import { FolderTree } from "~/components/index.js";
import { ParentFolderField } from "./ParentFolderField.js";

const t = i18n.ns("app-aco/dialogs/use-move-to-folder-dialog");

interface ShowDialogParams {
    title?: ReactNode;
    message?: ReactNode;
    acceptLabel?: ReactNode;
    cancelLabel?: ReactNode;
    loadingLabel?: string;
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
            <ParentFolderField label={helpText}>
                <Bind name={"folder"} defaultValue={{ id: focusedFolderId }}>
                    {({ value, onChange }) => (
                        <FolderTree
                            focusedFolderId={value.id}
                            onFolderClick={onChange}
                            enableCreate={true}
                        />
                    )}
                </Bind>
            </ParentFolderField>
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
            content: <Message helpText={message} focusedFolderId={focusedFolderId} />,
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
