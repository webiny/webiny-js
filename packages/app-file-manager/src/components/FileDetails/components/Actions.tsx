import React from "react";
import get from "lodash/get";
import styled from "@emotion/styled";
import { FileItem } from "@webiny/app-admin/types";
import getFileTypePlugin from "~/getFileTypePlugin";
import { CopyUrl } from "./actions/CopyUrl";
import { DeleteImage } from "./actions/DeleteImage";
import { Download } from "./actions/Download";
import { MoveTo } from "./actions/MoveTo";

const ActionsContainer = styled.div`
    text-align: center;
    border-bottom: 1px solid var(--mdc-theme-on-background);
`;

interface CustomActionProps {
    file: FileItem;
}

interface ActionsProps {
    file: FileItem;
    actions: FileDetailsActions;
}

export interface FileDetailsActions {
    copyUrl: boolean;
    delete: boolean;
    download: boolean;
    edit: boolean;
    moveToFolder: boolean;
}

export const Actions = ({ file, actions }: ActionsProps) => {
    const filePlugin = getFileTypePlugin(file);

    // TODO: implement actions using component composition
    const customActions: React.ComponentType<CustomActionProps>[] =
        get(filePlugin, "fileDetails.actions") || get(filePlugin, "actions") || [];

    return (
        <ActionsContainer>
            {actions.download ? <Download /> : null}
            {actions.moveToFolder ? <MoveTo /> : null}
            {actions.copyUrl ? <CopyUrl /> : null}
            {customActions.map(
                (Component: React.ComponentType<CustomActionProps>, index: number) => (
                    <Component key={index} file={file} />
                )
            )}
            {actions.delete ? <DeleteImage /> : null}
        </ActionsContainer>
    );
};
