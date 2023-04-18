import React, { ReactElement } from "react";

import { ReactComponent as FolderIcon } from "@material-design-icons/svg/outlined/folder.svg";

import { FolderContainer, Text } from "~/components/Folder/styled";

import { FolderItem } from "@webiny/app-aco/types";

export interface FolderProps {
    folder: FolderItem;
    onFolderClick: (id: string) => void;
}

export const Folder = ({ folder, onFolderClick }: FolderProps): ReactElement => {
    const { id, title } = folder;
    return (
        <FolderContainer onClick={() => onFolderClick(id)}>
            <FolderIcon />
            <Text use={"subtitle2"}>{title}</Text>
        </FolderContainer>
    );
};
